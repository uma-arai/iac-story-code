import { Construct, Stack, Tags } from "@aws-cdk/core";
import { ISecurityGroup, IVpc, SubnetType } from "@aws-cdk/aws-ec2";
import { IParameter } from "@aws-cdk/aws-ssm";
import { Vpc as CnisVpc } from "./modules/foundation/vpc";
import constants from "../constants";
import { ControlPlane } from "./modules/services/control-plane";
import { Parameter } from "./modules/parameter";
import { SecurityGroups } from "./modules/foundation/security-group";
import { VpcEndpoint } from "./modules/foundation/vpce";

export class CnisInfraStack extends Stack {
  readonly vpc: IVpc;
  readonly securityGroupList: Map<string, ISecurityGroup>;
  readonly ssmParameters: Map<string, IParameter>;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    Tags.of(this).add("Project", constants.ProjectName);

    // Security groups
    this.securityGroupList = new SecurityGroups(this, "securityGroup", {
      vpc: this.vpc,
    }).securityGroups;

    // Network resources
    const vpcCidr = "10.100.0.0/16";
    // TODO: 正規表現チェック
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
    this.vpc = cnisVpc.vpc;
    new VpcEndpoint(this, "vpce", {
      vpc: this.vpc,
      securityGroups: this.securityGroupList,
    });

    // ECS Cluster
    new ControlPlane(this, `${constants.ServicePrefix}-cluster`, {
      vpc: this.vpc,
    });

    // Parameter Store
    const parameters = {
      "cnis-ssm-param-cnis-app": "Cloud Native IaC Story",
    };
    this.ssmParameters = new Parameter(
      this,
      `${constants.ServicePrefix}-parameters`,
      parameters
    ).parameters;
  }
}
