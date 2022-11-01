import { getEnvContext } from "../../helper";
import { env } from "../../../environment";
import {
  DeploymentControllerType,
  FargatePlatformVersion,
  FargateService,
  ICluster,
  TaskDefinition,
} from "aws-cdk-lib/aws-ecs";
import {
  ApplicationListenerRule,
  ApplicationProtocol,
  ApplicationTargetGroup,
  IApplicationListener,
  ListenerAction,
  ListenerCondition,
  TargetType,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { ISecurityGroup, SelectedSubnets } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { Duration } from "aws-cdk-lib";

export interface IEcsServiceProps {
  cluster: ICluster;
  //listeners: IApplicationListener[];
  serviceSecurityGroup: ISecurityGroup;
  selectedSubnet: SelectedSubnets;
  // NOTE: 本来Interfaceに依存すべきであるが具象型しかされていない
  taskDefinition: TaskDefinition;
  //
  listener: IApplicationListener;
}

export class EcsService extends Construct {
  constructor(scope: Construct, id: string, props: IEcsServiceProps) {
    super(scope, id);

    const {
      cluster,
      serviceSecurityGroup,
      selectedSubnet,
      taskDefinition,
      listener,
    } = props;
    const { desiredCount } = getEnvContext(scope).serviceParameters;

    // ECSサービスの作成
    const service = new FargateService(this, `ecs-service`, {
      serviceName: `${env.global.servicePrefix}-ecs-service-app`,
      cluster,
      taskDefinition,
      platformVersion: FargatePlatformVersion.VERSION1_4,
      assignPublicIp: false,
      enableECSManagedTags: true,
      healthCheckGracePeriod: Duration.minutes(1),
      desiredCount,
      securityGroups: [serviceSecurityGroup],
      vpcSubnets: selectedSubnet,
      deploymentController: {
        type: DeploymentControllerType.ECS,
      },
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
    });
    //const cfnEcsService = this.service.node.defaultChild as CfnService;
    //cfnEcsService.cfnOptions.deletionPolicy = CfnDeletionPolicy.RETAIN;

    const targetGroupProps = {
      port: 80,
      protocol: ApplicationProtocol.HTTP,
      targetType: TargetType.IP,
      vpc: cluster.vpc,
      healthCheck: {
        healthyThresholdCount: 3,
        unhealthyThresholdCount: 2,
        timeout: Duration.seconds(5),
        interval: Duration.seconds(15),
        path: "/healthcheck",
        healthyHttpCodes: "200",
      },
    };

    const tg = new ApplicationTargetGroup(this, `service-target-group`, {
      targetGroupName: `${env.global.servicePrefix}-tg-app`,
      targets: [service],
      ...targetGroupProps,
    });

    new ApplicationListenerRule(this, `ecs-service-listener-rule`, {
      listener,
      priority: 1,
      action: ListenerAction.forward([tg]),
      conditions: [ListenerCondition.pathPatterns(["/*"])],
    });
  }
}
