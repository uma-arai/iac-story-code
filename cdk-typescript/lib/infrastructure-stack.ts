import { Construct, Stack, Tags } from "@aws-cdk/core";
import { ISecurityGroup, IVpc, SubnetType } from "@aws-cdk/aws-ec2";
import { Vpc as CnisVpc } from "./modules/foundation/vpc";
import constants from "../constants";
import { ControlPlane } from "./modules/services/control-plane";
import { Parameter } from "./modules/parameter";
import { SecurityGroups } from "./modules/foundation/security-group";
import { VpcEndpoint } from "./modules/foundation/vpce";
import { ICluster } from "@aws-cdk/aws-ecs";
import { parameterKeys } from "../params";
import { validateIpRange } from "./helper";
import { IRole } from "@aws-cdk/aws-iam";
import { Iam as BaseIam } from "./modules/foundation/iam";

export class CnisInfraStack extends Stack {
  readonly vpc: IVpc;
  readonly securityGroupList: Map<string, ISecurityGroup>;
  readonly cluster: ICluster;
  readonly ecsTaskExecutionRole: IRole;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    Tags.of(this).add("Project", constants.ProjectName);

    // Network resources
    const ipRange = "10.0.0.0";
    if (!validateIpRange(ipRange)) {
      throw new Error("Invalid CIDR range");
    }

    const vpcCidr = `${ipRange}/16`;
    const cnisVpc = new CnisVpc(this, `${constants.ServicePrefix}-vpc`, {
      cidr: vpcCidr,
      subnetConfigurations: [
        {
          name: `ingress`,
          subnetType: SubnetType.PUBLIC,
        },
        {
          name: "app",
          subnetType: SubnetType.ISOLATED,
        },
        {
          name: "egress",
          subnetType: SubnetType.ISOLATED,
        },
      ],
    });

    // Security groups
    this.securityGroupList = new SecurityGroups(
      this,
      `${constants.ServicePrefix}-securityGroup`,
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
      `${constants.ServicePrefix}-cluster`,
      {
        vpc: cnisVpc.vpc,
      }
    );

    // Parameter Store
    const parameters: Record<string, string> = {};
    parameters[parameterKeys.AppParams] = "Cloud Native IaC Story";
    new Parameter(this, `${constants.ServicePrefix}-parameters`, parameters);

    // IAM
    const iam = new BaseIam(this, "iam");
    this.ecsTaskExecutionRole = iam.ecsTaskExecutionRole;

    this.vpc = cnisVpc.vpc;
    this.cluster = controlPlane.cluster;
  }
}
