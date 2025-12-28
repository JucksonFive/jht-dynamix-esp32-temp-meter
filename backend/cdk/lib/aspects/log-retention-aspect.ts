import { IAspect } from "aws-cdk-lib";
import { CfnLogGroup } from "aws-cdk-lib/aws-logs";
import { IConstruct } from "constructs";

/**
 * An Aspect that applies a specified retention period to all CloudWatch Log Groups.
 *
 * If a LogGroup already has retention configured, it is left untouched.
 */
export class LogRetentionAspect implements IAspect {
  private readonly retentionDays: number;

  constructor(retentionDays: number) {
    this.retentionDays = retentionDays;
  }

  public visit(node: IConstruct): void {
    if (node instanceof CfnLogGroup) {
      if (node.retentionInDays === undefined) {
        node.retentionInDays = this.retentionDays;
      }
    }
  }
}
