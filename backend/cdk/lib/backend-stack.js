"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackendStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const iot = __importStar(require("aws-cdk-lib/aws-iot"));
const dynamoDb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
class BackendStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const thing = new cdk.aws_iot.CfnThing(this, "Esp32Thing", {
            thingName: "esp32-sensor",
        });
        const policy = new iot.CfnPolicy(this, "Esp32Policy", {
            policyName: "Esp32SensorPolicy",
            policyDocument: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Effect: "Allow",
                        Action: [
                            "iot:Connect",
                            "iot:Publish",
                            "iot:Receive",
                            "iot:Subscribe",
                        ],
                        Resource: "*",
                    },
                ],
            },
        });
        const table = new dynamoDb.Table(this, "TemperaturesTable", {
            tableName: "Temperatures",
            partitionKey: { name: "deviceId", type: dynamoDb.AttributeType.STRING },
            sortKey: { name: "timestamp", type: dynamoDb.AttributeType.STRING },
            billingMode: dynamoDb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY, // Dev environment only. Removes all the data!
        });
    }
}
exports.BackendStack = BackendStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2VuZC1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImJhY2tlbmQtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMseURBQTJDO0FBQzNDLG1FQUFxRDtBQUdyRCxNQUFhLFlBQWEsU0FBUSxHQUFHLENBQUMsS0FBSztJQUN6QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sS0FBSyxHQUFHLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRTtZQUN6RCxTQUFTLEVBQUUsY0FBYztTQUMxQixDQUFDLENBQUM7UUFFSCxNQUFNLE1BQU0sR0FBRyxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRTtZQUNwRCxVQUFVLEVBQUUsbUJBQW1CO1lBQy9CLGNBQWMsRUFBRTtnQkFDZCxPQUFPLEVBQUUsWUFBWTtnQkFDckIsU0FBUyxFQUFFO29CQUNUO3dCQUNFLE1BQU0sRUFBRSxPQUFPO3dCQUNmLE1BQU0sRUFBRTs0QkFDTixhQUFhOzRCQUNiLGFBQWE7NEJBQ2IsYUFBYTs0QkFDYixlQUFlO3lCQUNoQjt3QkFDRCxRQUFRLEVBQUUsR0FBRztxQkFDZDtpQkFDRjthQUNGO1NBQ0YsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxLQUFLLEdBQUcsSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxtQkFBbUIsRUFBRTtZQUMxRCxTQUFTLEVBQUUsY0FBYztZQUN6QixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUN2RSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUNuRSxXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxlQUFlO1lBQ2pELGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSw4Q0FBOEM7U0FDekYsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBbENELG9DQWtDQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tIFwiYXdzLWNkay1saWJcIjtcbmltcG9ydCAqIGFzIGlvdCBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWlvdFwiO1xuaW1wb3J0ICogYXMgZHluYW1vRGIgZnJvbSBcImF3cy1jZGstbGliL2F3cy1keW5hbW9kYlwiO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIjtcblxuZXhwb3J0IGNsYXNzIEJhY2tlbmRTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIGNvbnN0IHRoaW5nID0gbmV3IGNkay5hd3NfaW90LkNmblRoaW5nKHRoaXMsIFwiRXNwMzJUaGluZ1wiLCB7XG4gICAgICB0aGluZ05hbWU6IFwiZXNwMzItc2Vuc29yXCIsXG4gICAgfSk7XG5cbiAgICBjb25zdCBwb2xpY3kgPSBuZXcgaW90LkNmblBvbGljeSh0aGlzLCBcIkVzcDMyUG9saWN5XCIsIHtcbiAgICAgIHBvbGljeU5hbWU6IFwiRXNwMzJTZW5zb3JQb2xpY3lcIixcbiAgICAgIHBvbGljeURvY3VtZW50OiB7XG4gICAgICAgIFZlcnNpb246IFwiMjAxMi0xMC0xN1wiLFxuICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBFZmZlY3Q6IFwiQWxsb3dcIixcbiAgICAgICAgICAgIEFjdGlvbjogW1xuICAgICAgICAgICAgICBcImlvdDpDb25uZWN0XCIsXG4gICAgICAgICAgICAgIFwiaW90OlB1Ymxpc2hcIixcbiAgICAgICAgICAgICAgXCJpb3Q6UmVjZWl2ZVwiLFxuICAgICAgICAgICAgICBcImlvdDpTdWJzY3JpYmVcIixcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBSZXNvdXJjZTogXCIqXCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgY29uc3QgdGFibGUgPSBuZXcgZHluYW1vRGIuVGFibGUodGhpcywgXCJUZW1wZXJhdHVyZXNUYWJsZVwiLCB7XG4gICAgICB0YWJsZU5hbWU6IFwiVGVtcGVyYXR1cmVzXCIsXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogXCJkZXZpY2VJZFwiLCB0eXBlOiBkeW5hbW9EYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgICAgc29ydEtleTogeyBuYW1lOiBcInRpbWVzdGFtcFwiLCB0eXBlOiBkeW5hbW9EYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgICAgYmlsbGluZ01vZGU6IGR5bmFtb0RiLkJpbGxpbmdNb2RlLlBBWV9QRVJfUkVRVUVTVCxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksIC8vIERldiBlbnZpcm9ubWVudCBvbmx5LiBSZW1vdmVzIGFsbCB0aGUgZGF0YSFcbiAgICB9KTtcbiAgfVxufVxuIl19