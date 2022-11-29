import {
  ApplicationListener,
  ApplicationLoadBalancer,
  ApplicationProtocol,
  ApplicationTargetGroup,
  IApplicationListener,
  IApplicationLoadBalancer,
  IpAddressType,
  ITargetGroup,
  ListenerAction,
  TargetType,
  Protocol,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { ISecurityGroup, IVpc } from "aws-cdk-lib/aws-ec2";
import { Duration, Tags } from "aws-cdk-lib";
import { Construct } from "constructs";
import { env } from "../../../environment";

export interface IAlbProps {
  vpc: IVpc;
  securityGroup: ISecurityGroup;
}

export class AppLoadBalancer extends Construct {
  readonly alb: IApplicationLoadBalancer;
  readonly targetGroup: ITargetGroup;
  readonly listener: IApplicationListener;

  constructor(scope: Construct, id: string, props: IAlbProps) {
    super(scope, id);
    const { vpc, securityGroup } = props;

    this.alb = new ApplicationLoadBalancer(this, `alb`, {
      loadBalancerName: `${env.global.servicePrefix}-alb-app`,
      internetFacing: true,
      securityGroup,
      vpc,
      vpcSubnets: vpc.selectSubnets({
        onePerAz: true,
        subnetGroupName: "ingress",
      }),
      ipAddressType: IpAddressType.IPV4,
      idleTimeout: Duration.minutes(1),
      // WARNING: 最終的にはTrueにする必要がある
      deletionProtection: false,
    });

    // NOTE: リスナー作成時に何かしらターゲットグループを設定する必要があるためダミーを作成
    const targetGroupName = `${env.global.servicePrefix}-alb-tg-dummy`;
    const targetGroup = new ApplicationTargetGroup(scope, `alb-tg-dummy`, {
      targetGroupName,
      healthCheck: {
        interval: Duration.seconds(10),
        path: "/healthcheck",
        port: "80",
        protocol: Protocol.HTTP,
        timeout: Duration.seconds(5),
        healthyThresholdCount: 3,
        unhealthyThresholdCount: 2,
        healthyHttpCodes: "200",
      },
      targetType: TargetType.IP,
      port: 80,
      protocol: ApplicationProtocol.HTTP,
      vpc,
    });
    Tags.of(targetGroup).add("Name", targetGroupName);
    this.targetGroup = targetGroup;

    this.listener = new ApplicationListener(scope, `alb-listener`, {
      loadBalancer: this.alb,
      open: false,
      port: 80,
      protocol: ApplicationProtocol.HTTP,
      defaultAction: ListenerAction.forward([targetGroup]),
    });
  }
}
