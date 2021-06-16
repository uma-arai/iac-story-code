import { Construct } from "@aws-cdk/core";
import { IVpc } from "@aws-cdk/aws-ec2";
import { Cluster as EcsCluster, ICluster } from "@aws-cdk/aws-ecs";
import constants from "../../../constants";

interface IControlPlaneProps {
  vpc: IVpc;
}

export class ControlPlane extends Construct {
  readonly cluster: ICluster;

  constructor(scope: Construct, id: string, props: IControlPlaneProps) {
    super(scope, id);

    if (!props?.vpc) {
      throw new Error("No props is found");
    }

    const { vpc } = props;
    this.cluster = new EcsCluster(this, `control-plane`, {
      vpc,
      containerInsights: true,
      clusterName: `${constants.ServicePrefix}-ecs-cluster-app`,
    });
  }
}
