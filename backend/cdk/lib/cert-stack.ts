import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";

interface CertStackProps extends cdk.StackProps {
  domainName: string; // Hosted zone apex (e.g. jt-dynamix.com)
  siteDomain: string; // Primary site (e.g. app.jt-dynamix.com for dashboard)
  additionalDomains?: string[]; // Extra SANs: apex, wildcard, etc.
}

export class CertStack extends cdk.Stack {
  public readonly certificateArn: string;

  constructor(scope: Construct, id: string, props: CertStackProps) {
    super(scope, id, props);

    const hostedZone = route53.HostedZone.fromLookup(this, "HostedZone", {
      domainName: props.domainName,
    });

    const cert = new acm.Certificate(this, "SiteCertV2", {
      domainName: props.siteDomain,
      subjectAlternativeNames: props.additionalDomains,
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });
    this.certificateArn = cert.certificateArn;
  }
}
