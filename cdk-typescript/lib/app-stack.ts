import * as cdk from "@aws-cdk/core";
import { Stack, StackProps, Tags } from "@aws-cdk/core";
import constants from "../constants";
import { StringParameter } from "@aws-cdk/aws-ssm";
import { ISecurityGroup, IVpc } from "@aws-cdk/aws-ec2";
import { SecurityGroupNameType } from "../model";
import { EcsService as CnisEcsService } from "./modules/services/ecs-service";
import { getEnvContext } from "./helper";
import { FargateTaskDefinition, ICluster } from "@aws-cdk/aws-ecs";
import { ContainerDefinition } from "./modules/services/container-definition";
import { IRole } from "@aws-cdk/aws-iam";
import { IRepository } from "@aws-cdk/aws-ecr/lib/repository";
import { ILogGroup } from "@aws-cdk/aws-logs";
import { AppLoadBalancer as CnisAlb } from "./modules/loadbalancer/alb";
import { parameterKeys } from "../params";

interface IAppStackProps extends StackProps {
  vpc: IVpc;
  securityGroups: Map<string, ISecurityGroup>;
  controlPlane: {
    cluster: ICluster;
    executionRole: IRole;
    repository: IRepository;
    logGroup: ILogGroup;
  };
}

export class AppStack extends Stack {
  constructor(scope: cdk.App, id: string, props: IAppStackProps) {
    super(scope, id, props);

    const { vpc, securityGroups, controlPlane } = props;
    const { executionRole, cluster, repository, logGroup } = controlPlane;

    Tags.of(this).add("Project", constants.ProjectName);
    const { taskCpu, taskMemory } = getEnvContext(this).serviceParameters;

    // ALB
    const securityGroup = securityGroups.get(SecurityGroupNameType.ingress);
    if (!securityGroup) {
      throw new Error("No alb security group is set");
    }
    const albInfo = new CnisAlb(this, `${constants.ServicePrefix}-alb`, {
      vpc,
      securityGroup,
    });

    // タスク定義の作成
    const taskDefinition = new FargateTaskDefinition(this, `ecs-taskdef`, {
      memoryLimitMiB: taskMemory,
      cpu: taskCpu,
      executionRole,

      family: `${constants.ServicePrefix}-ecs-taskdef-app`,
    });

    // コンテナ定義の作成
    const containerParameters = {
      SSM_PARAM_TEST: StringParameter.fromStringParameterName(
        this,
        "ssm-param-test",
        parameterKeys.AppParams
      ),
    };
    new ContainerDefinition(this, `ecs-container-def`, {
      repository,
      parameterMap: containerParameters,
      taskDefinition,
      logGroup,
    });

    // ECS Service
    const appSecurityGroup = securityGroups.get(SecurityGroupNameType.app);
    if (!appSecurityGroup) {
      throw new Error("No application security group for cluster found");
    }
    new CnisEcsService(this, `${constants.ServicePrefix}-ecs-service`, {
      cluster,
      serviceSecurityGroup: appSecurityGroup,
      taskDefinition,
      selectedSubnet: vpc.selectSubnets({ subnetGroupName: "app" }),
      listener: albInfo.listener,
    });
  }
}
