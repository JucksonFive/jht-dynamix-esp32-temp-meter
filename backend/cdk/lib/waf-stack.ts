import * as cdk from "aws-cdk-lib";
import { aws_wafv2 as wafv2 } from "aws-cdk-lib";

export interface WafStackProps extends cdk.StackProps {
  /**
   * The scope of this Web ACL.
   * Valid values are CLOUDFRONT and REGIONAL.
   * For CLOUDFRONT, you must create the WAF in us-east-1.
   */
  scope: "CLOUDFRONT" | "REGIONAL";
  /**
   * A descriptive name for the CloudWatch metric.
   */
  metricName: string;
}

export class WafStack extends cdk.Stack {
  public readonly webAclArn: string;

  constructor(scope: cdk.App, id: string, props: WafStackProps) {
    super(scope, id, props);

    const webAcl = new wafv2.CfnWebACL(this, "WebAcl", {
      name: id,
      scope: props.scope,
      defaultAction: { allow: {} },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: props.metricName,
      },
      rules: [
        {
          name: "AWS-AWSManagedRulesCommonRuleSet",
          priority: 1,
          statement: {
            managedRuleGroupStatement: {
              vendorName: "AWS",
              name: "AWSManagedRulesCommonRuleSet",
            },
          },
          overrideAction: {
            // Use Count mode to monitor rules before blocking
            count: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: `${props.metricName}-CommonRuleSet`,
          },
        },
        {
          name: "AWS-AWSManagedRulesAmazonIpReputationList",
          priority: 2,
          statement: {
            managedRuleGroupStatement: {
              vendorName: "AWS",
              name: "AWSManagedRulesAmazonIpReputationList",
            },
          },
          overrideAction: {
            count: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: `${props.metricName}-IpReputationList`,
          },
        },
      ],
    });

    this.webAclArn = webAcl.attrArn;

    new cdk.CfnOutput(this, "WebAclArn", { value: this.webAclArn });
  }
}
