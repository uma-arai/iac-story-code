import * as cdk from "@aws-cdk/core";
import { Construct } from "@aws-cdk/core";
import { IVpc, Vpc as CoreVpc } from "@aws-cdk/aws-ec2";
import { SubnetConfiguration } from "@aws-cdk/aws-ec2/lib/vpc";
import constants from "../../../constants";

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
      cidr,
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: subnetConfigurations.map((subnet) => {
        return {
          ...subnet,
          cidrMask: 24,
        };
      }),
    });

    cdk.Tags.of(this.vpc).add("Name", `${constants.ServicePrefix}-vpc`);
  }
}
