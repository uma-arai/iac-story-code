import * as awsx from "@pulumi/awsx";
import * as aws from "@pulumi/aws";

import { getConfig } from "./configs/config";

const cfg = getConfig();

const vpcName = `${cfg.resourcePrefix}-vpc-main`;
const vpc = new awsx.ec2.Vpc(vpcName, {
  cidrBlock: "10.100.0.0/16",
  tags: {
    Name: vpcName
  },
  numberOfAvailabilityZones: 2,
  numberOfNatGateways: 0
});

const nameWithTag = async () => {
  const igw = await vpc.internetGateway;
  if (!igw) {
    throw new Error("error");
  }

  new aws.ec2.Tag("igw-tag", {
    resourceId: igw.internetGateway.id,
    key: "Name",
    value: `${cfg.resourcePrefix}-igw-main`
  });
};

nameWithTag();

// Export a few resulting fields to make them easy to use:
export const vpcId = vpc.id;
export const vpcPrivateSubnetIds = vpc.privateSubnetIds;
export const vpcPublicSubnetIds = vpc.publicSubnetIds;
