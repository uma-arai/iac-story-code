import { SecurityGroupNameType } from "../../../model";
import { env } from "../../../environment";
import {
  GatewayVpcEndpoint,
  GatewayVpcEndpointAwsService,
  InterfaceVpcEndpoint,
  InterfaceVpcEndpointAwsService,
  ISecurityGroup,
  IVpc,
  Port,
} from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { Tags } from "aws-cdk-lib";

interface IVpcEndpointProps {
  vpc: IVpc;
  securityGroups: Map<string, ISecurityGroup>;
}

export class VpcEndpoint extends Construct {
  constructor(scope: Construct, id: string, props: IVpcEndpointProps) {
    super(scope, id);

    const { vpc, securityGroups } = props;

    // Preparing security groups for setup
    const sgApp = securityGroups.get(SecurityGroupNameType.app);
    const sgVpce = securityGroups.get(SecurityGroupNameType.vpce);
    if (!sgApp || !sgVpce) {
      return;
    }

    const interfaceEndpointProps = {
      subnets: vpc.selectSubnets({
        onePerAz: true,
        subnetGroupName: SecurityGroupNameType.vpce,
      }),
      securityGroups: [sgVpce],
      privateDnsEnabled: true,
      open: false,
    };

    const ecrVpce = new InterfaceVpcEndpoint(this, "ecr-vpce", {
      vpc,
      service: InterfaceVpcEndpointAwsService.ECR,
      ...interfaceEndpointProps,
    });

    const ecrVpceDkr = new InterfaceVpcEndpoint(this, "ecr-vpce-dkr", {
      vpc,
      service: InterfaceVpcEndpointAwsService.ECR_DOCKER,
      ...interfaceEndpointProps,
    });

    const s3Vpce = new GatewayVpcEndpoint(this, "s3-vpce", {
      vpc,
      service: GatewayVpcEndpointAwsService.S3,
      subnets: [{ subnetGroupName: SecurityGroupNameType.app }],
    });

    const clwVpce = new InterfaceVpcEndpoint(this, "clw-vpce", {
      vpc,
      service: InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      ...interfaceEndpointProps,
    });

    const ssmVpce = new InterfaceVpcEndpoint(this, "ssm-vpce", {
      vpc,
      service: InterfaceVpcEndpointAwsService.SSM,
      ...interfaceEndpointProps,
    });

    ecrVpce.connections.allowFrom(sgApp, Port.tcp(443), "HTTPS for container");

    // NOTE: https://github.com/aws/aws-cdk/issues/8463
    // 2021/02現在、VPCエンドポイントにタグ付けがサポートされていないため下記はワークしない
    // しかしエラーにもならないので残しておく
    Tags.of(ecrVpce).add("Name", `${env.global.servicePrefix}-vpce-ecr-api`);
    Tags.of(ecrVpceDkr).add("Name", `${env.global.servicePrefix}-vpce-ecr-dkr`);
    Tags.of(s3Vpce).add("Name", `${env.global.servicePrefix}-vpce-s3`);
    Tags.of(clwVpce).add("Name", `${env.global.servicePrefix}-vpce-clw`);
    Tags.of(ssmVpce).add("Name", `${env.global.servicePrefix}-vpce-ssm`);
  }
}
