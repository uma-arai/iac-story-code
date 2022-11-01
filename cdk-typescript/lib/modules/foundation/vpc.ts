import { env } from "../../../environment";
import {
  IpAddresses,
  IVpc,
  SubnetConfiguration,
  Vpc as CoreVpc,
} from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { Tags } from "aws-cdk-lib";

interface IVpcProps {
  cidr: string;
  subnetConfigurations: Pick<SubnetConfiguration, "name" | "subnetType">[];
}

export class Vpc extends Construct {
  readonly vpc: IVpc;

  constructor(scope: Construct, id: string, props: IVpcProps) {
    super(scope, id);

    const { cidr, subnetConfigurations } = props;

    this.vpc = new CoreVpc(this, "vpc", {
      ipAddresses: IpAddresses.cidr(cidr),
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: subnetConfigurations.map((subnet) => {
        return {
          ...subnet,
          cidrMask: 24,
        };
      }),
    });

    Tags.of(this.vpc).add("Name", `${env.global.servicePrefix}-vpc`);
  }
}
