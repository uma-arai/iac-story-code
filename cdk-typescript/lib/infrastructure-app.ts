import { Construct, Stack, StackProps } from "@aws-cdk/core";
import { ISecurityGroup, IVpc, SubnetType } from "@aws-cdk/aws-ec2";
import { IParameter } from "@aws-cdk/aws-ssm";
import { Vpc as CnisVpc } from "./modules/foundation/vpc";

interface IInfraStackProps extends StackProps {
  serviceName: string;
}

export class CnisInfraStack extends Stack {
  // ★ポイント★：外部から利用できるようにクラス変数として書き出す
  readonly vpc: IVpc;
  readonly sgList: ISecurityGroup[];
  readonly ssmParameters: Map<string, IParameter>;

  constructor(scope: Construct, id: string, props?: IInfraStackProps) {
    super(scope, id);
    const { serviceName } = props;
    // TODO: Aspectで全部にProjectのTagつける

    const vpcCidr = "10.100.0.0/16";
    // TODO: 正規表現チェック
    const cnisVpc = new CnisVpc(this, `${serviceName}-vpc`, {
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
  }
}
