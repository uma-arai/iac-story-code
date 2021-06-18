import { Construct, Stack, Tags } from "@aws-cdk/core";
import { ISecurityGroup, IVpc, SubnetType } from "@aws-cdk/aws-ec2";
import { IParameter } from "@aws-cdk/aws-ssm";
import { Vpc as CnisVpc } from "./modules/foundation/vpc";
import constants from "../constants";
import { ControlPlane } from "./modules/services/control-plane";
import { Parameter } from "./modules/parameter";
import { SecurityGroups } from "./modules/foundation/security-group";
import { VpcEndpoint } from "./modules/foundation/vpce";
import { ICluster } from "@aws-cdk/aws-ecs";
import { parameterKeys } from "../params";
import { validateIpRange } from "./helper";

export class CnisInfraStack extends Stack {
  readonly vpc: IVpc;
  readonly securityGroupList: Map<string, ISecurityGroup>;
  readonly parameters: Map<string, IParameter>;
  readonly cluster: ICluster;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    Tags.of(this).add("Project", constants.ProjectName);

    // Network resources
    const ipRange = "10.100.0.0";
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
    this.parameters = new Parameter(
      this,
      `${constants.ServicePrefix}-parameters`,
      parameters
    ).parameters;

    this.vpc = cnisVpc.vpc;
    this.cluster = controlPlane.cluster;
  }
}
