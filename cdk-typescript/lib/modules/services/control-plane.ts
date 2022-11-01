import { env } from "../../../environment";
import { IVpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { Cluster, ICluster } from "aws-cdk-lib/aws-ecs";

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
    this.cluster = new Cluster(this, `control-plane`, {
      vpc,
      containerInsights: true,
      clusterName: `${env.global.servicePrefix}-ecs-cluster-app`,
    });
  }
}
