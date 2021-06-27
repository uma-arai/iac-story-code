import * as cdk from "@aws-cdk/core";
import {
  DeploymentControllerType,
  FargatePlatformVersion,
  FargateService,
  ICluster,
} from "@aws-cdk/aws-ecs";
import {
  ApplicationListenerRule,
  ApplicationProtocol,
  ApplicationTargetGroup,
  IApplicationListener,
  ListenerAction,
  ListenerCondition,
  TargetType,
} from "@aws-cdk/aws-elasticloadbalancingv2";
import { ISecurityGroup, SelectedSubnets } from "@aws-cdk/aws-ec2";
import { getEnvContext } from "../../helper";
import constants from "../../../constants";
import { TaskDefinition } from "@aws-cdk/aws-ecs/lib/base/task-definition";

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

export class EcsService extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: IEcsServiceProps) {
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
      serviceName: `${constants.ServicePrefix}-ecs-service-app`,
      cluster,
      taskDefinition,
      platformVersion: FargatePlatformVersion.VERSION1_4,
      assignPublicIp: false,
      enableECSManagedTags: true,
      healthCheckGracePeriod: cdk.Duration.minutes(1),
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
        timeout: cdk.Duration.seconds(5),
        interval: cdk.Duration.seconds(15),
        path: "/healthcheck",
        healthyHttpCodes: "200",
      },
    };

    const tg = new ApplicationTargetGroup(this, `service-target-group`, {
      targetGroupName: `${constants.ServicePrefix}-tg-app`,
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
