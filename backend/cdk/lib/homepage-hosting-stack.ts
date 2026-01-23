import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cf from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";

interface Props extends cdk.StackProps {
  domainName: string;
  siteDomain: string;
  certificateArn: string;
  globalWafArn?: string;
}

export class HomepageHostingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    const hostedZone = route53.HostedZone.fromLookup(
      this,
      "HomepageHostedZone",
      {
        domainName: props.domainName,
      }
    );

    const siteBucket = new s3.Bucket(this, "HomepageSiteBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
    });

    const originAccessControl = new cf.S3OriginAccessControl(
      this,
      "HomepageOAC",
      {
        description: "OAC for homepage hosting bucket",
      }
    );

    const certificate = acm.Certificate.fromCertificateArn(
      this,
      "HomepageCert",
      props.certificateArn
    );

    const responseHeadersPolicy = new cf.ResponseHeadersPolicy(
      this,
      "HomepageSecurityHeadersPolicy",
      {
        securityHeadersBehavior: {
          strictTransportSecurity: {
            override: true,
            accessControlMaxAge: cdk.Duration.days(365),
            includeSubdomains: true,
            preload: true,
          },
          contentTypeOptions: { override: true },
          frameOptions: {
            frameOption: cf.HeadersFrameOption.DENY,
            override: true,
          },
          xssProtection: { protection: true, modeBlock: true, override: true },
        },
      }
    );

    const logBucket = new s3.Bucket(this, "HomepageLogBucket", {
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
      lifecycleRules: [{ expiration: cdk.Duration.days(90) }],
    });

    const distribution = new cf.Distribution(this, "HomepageSiteDistribution", {
      defaultRootObject: "index.html",
      domainNames: [props.siteDomain],
      certificate,
      minimumProtocolVersion: cf.SecurityPolicyProtocol.TLS_V1_2_2021,
      enableLogging: true,
      logBucket: logBucket,
      logFilePrefix: "homepage-access-logs/",
      webAclId: props.globalWafArn,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket, {
          originAccessControl,
        }),
        viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        compress: true,
        responseHeadersPolicy: responseHeadersPolicy,
      },
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: cdk.Duration.seconds(0),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: cdk.Duration.seconds(0),
        },
      ],
    });

    // Bucket policy to allow CloudFront distribution access only
    siteBucket.addToResourcePolicy(
      new cdk.aws_iam.PolicyStatement({
        effect: cdk.aws_iam.Effect.ALLOW,
        principals: [
          new cdk.aws_iam.ServicePrincipal("cloudfront.amazonaws.com"),
        ],
        actions: ["s3:GetObject"],
        resources: [`${siteBucket.bucketArn}/*`],
        conditions: {
          StringEquals: {
            "AWS:SourceArn": `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`,
          },
        },
      })
    );

    new route53.ARecord(this, "HomepageAliasRecord", {
      zone: hostedZone,
      recordName: props.siteDomain, // apex
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution)
      ),
      ttl: cdk.Duration.minutes(5),
    });

    new s3deploy.BucketDeployment(this, "DeployHomepage", {
      sources: [s3deploy.Source.asset("../../homepage/dist")],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ["/*"],
      prune: true,
    });

    new cdk.CfnOutput(this, "HomepageURL", {
      value: `https://${props.siteDomain}`,
    });
    new cdk.CfnOutput(this, "HomepageDistributionId", {
      value: distribution.distributionId,
    });
    new cdk.CfnOutput(this, "HomepageBucketName", {
      value: siteBucket.bucketName,
    });
  }
}
