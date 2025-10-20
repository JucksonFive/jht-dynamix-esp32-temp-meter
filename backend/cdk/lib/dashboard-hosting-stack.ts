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
}

export class DashboardHostingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    const hostedZone = route53.HostedZone.fromLookup(this, "HostedZone", {
      domainName: props.domainName,
    });

    // Private bucket; CloudFront lukee OAI:lla
    const siteBucket = new s3.Bucket(this, "SiteBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      // optional: removalPolicy: cdk.RemovalPolicy.DESTROY, autoDeleteObjects: true
    });

    // Create Origin Access Control (OAC) - modern replacement for OAI
    const originAccessControl = new cf.S3OriginAccessControl(this, "OAC", {
      description: "OAC for dashboard hosting bucket",
    });

    const certificate = acm.Certificate.fromCertificateArn(
      this,
      "SiteCert",
      props.certificateArn
    );

    // 1. Parannus: Lisää turvallisuusotsakkeet
    const responseHeadersPolicy = new cf.ResponseHeadersPolicy(
      this,
      "SecurityHeadersPolicy",
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
          xssProtection: {
            protection: true,
            modeBlock: true,
            override: true,
          },
        },
      }
    );

    // 2. Parannus: Ota lokitus käyttöön (valinnainen, mutta suositeltu)
    const logBucket = new s3.Bucket(this, "LogBucket", {
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
      lifecycleRules: [{ expiration: cdk.Duration.days(90) }],
    });

    const distribution = new cf.Distribution(this, "SiteDistribution", {
      defaultRootObject: "index.html",
      domainNames: [props.siteDomain],
      certificate,
      minimumProtocolVersion: cf.SecurityPolicyProtocol.TLS_V1_2_2021,
      // Lisää lokitus ja turvallisuusotsakkeet
      enableLogging: true,
      logBucket: logBucket,
      logFilePrefix: "distribution-access-logs/",
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket, {
          originAccessControl,
        }),
        viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        compress: true,
        responseHeadersPolicy: responseHeadersPolicy, // Liitä policy tähän
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

    new route53.ARecord(this, "AliasRecord", {
      zone: hostedZone,
      recordName: props.siteDomain,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution)
      ),
      ttl: cdk.Duration.minutes(5),
    });

    // Deployaa buildin S3:een ja invalaa CloudFrontin
    new s3deploy.BucketDeployment(this, "DeployWebsite", {
      sources: [s3deploy.Source.asset("../../dashboard/dist")],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ["/*"],
      prune: true,
    });

    new cdk.CfnOutput(this, "SiteURL", {
      value: `https://${props.siteDomain}`,
    });
    new cdk.CfnOutput(this, "DistributionId", {
      value: distribution.distributionId,
    });
    new cdk.CfnOutput(this, "BucketName", { value: siteBucket.bucketName });
  }
}
