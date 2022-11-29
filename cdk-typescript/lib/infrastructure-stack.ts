import { Vpc as CnisVpc } from "./modules/foundation/vpc";
import { ControlPlane } from "./modules/services/control-plane";
import { Parameter } from "./modules/parameter";
import { SecurityGroups } from "./modules/foundation/security-group";
import { VpcEndpoint } from "./modules/foundation/vpce";
import { parameterKeys } from "../params";
import { validateIpRange } from "./helper";
import { Iam as BaseIam } from "./modules/foundation/iam";
import { Stack, Tags } from "aws-cdk-lib";
import { ISecurityGroup, IVpc, SubnetType } from "aws-cdk-lib/aws-ec2";
import { IRole } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { ICluster } from "aws-cdk-lib/aws-ecs";
import { env } from "../environment";

export class CnisInfraStack extends Stack {
  readonly vpc: IVpc;
  readonly securityGroupList: Map<string, ISecurityGroup>;
  readonly cluster: ICluster;
  readonly ecsTaskExecutionRole: IRole;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    Tags.of(this).add("Project", env.global.projectName);

    // Network resources
    const ipRange = "10.0.0.0";
    if (!validateIpRange(ipRange)) {
      throw new Error("Invalid CIDR range");
    }

    const vpcCidr = `${ipRange}/16`;
    const cnisVpc = new CnisVpc(this, `${env.global.servicePrefix}-vpc`, {
      cidr: vpcCidr,
      subnetConfigurations: [
        {
          name: `ingress`,
          subnetType: SubnetType.PUBLIC,
        },
        {
          name: "app",
          subnetType: SubnetType.PRIVATE_ISOLATED,
        },
        {
          name: "egress",
          subnetType: SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Security groups
    this.securityGroupList = new SecurityGroups(
      this,
      `${env.global.servicePrefix}-securityGroup`,
      {
        vpc: cnisVpc.vpc,
      }
    ).securityGroups;

    new VpcEndpoint(this, "vpce", {
      vpc: cnisVpc.vpc,
      securityGroups: this.securityGroupList,
    });

    // ECS Cluster
    const controlPlane = new ControlPlane(
      this,
      `${env.global.servicePrefix}-cluster`,
      {
        vpc: cnisVpc.vpc,
      }
    );

    // Parameter Store
    const parameters: Record<string, string> = {};
    parameters[parameterKeys.AppParams] = "Cloud Native IaC Story";
    new Parameter(this, `${env.global.servicePrefix}-parameters`, parameters);

    // IAM
    const iam = new BaseIam(this, "iam");
    this.ecsTaskExecutionRole = iam.ecsTaskExecutionRole;

    this.vpc = cnisVpc.vpc;
    this.cluster = controlPlane.cluster;
  }
}
