// lib/cert-stack.ts
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";

interface Props extends cdk.StackProps {
  domainName: string;
  siteDomain: string;
}

export class CertStack extends cdk.Stack {
  public readonly certificateArn: string;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    const hostedZone = route53.HostedZone.fromLookup(this, "HostedZone", {
      domainName: props.domainName,
    });

    const cert = new acm.DnsValidatedCertificate(this, "SiteCert", {
      domainName: props.siteDomain,
      hostedZone,
      region: "us-east-1", // important for CloudFront
    });

    this.certificateArn = cert.certificateArn;
  }
}
