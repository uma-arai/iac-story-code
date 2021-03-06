import * as cdk from "@aws-cdk/core";
import { Duration, Tags } from "@aws-cdk/core";
import { ISecurityGroup, IVpc } from "@aws-cdk/aws-ec2";
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
  Protocol,
  TargetType,
} from "@aws-cdk/aws-elasticloadbalancingv2";
import constants from "../../../constants";

export interface IAlbProps {
  vpc: IVpc;
  securityGroup: ISecurityGroup;
}

export class AppLoadBalancer extends cdk.Construct {
  readonly alb: IApplicationLoadBalancer;
  readonly targetGroup: ITargetGroup;
  readonly listener: IApplicationListener;

  constructor(scope: cdk.Construct, id: string, props: IAlbProps) {
    super(scope, id);
    const { vpc, securityGroup } = props;

    this.alb = new ApplicationLoadBalancer(this, `alb`, {
      loadBalancerName: `${constants.ServicePrefix}-alb-app`,
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
    const targetGroupName = `${constants.ServicePrefix}-alb-tg-dummy`;
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
