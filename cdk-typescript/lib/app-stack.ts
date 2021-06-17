import * as cdk from "@aws-cdk/core";
import { RemovalPolicy, Stack, StackProps, Tags } from "@aws-cdk/core";
import constants from "../constants";
import { IParameter } from "@aws-cdk/aws-ssm";
import { ISecurityGroup, IVpc } from "@aws-cdk/aws-ec2";
import { SecurityGroupNameType } from "../model";
import { EcsService as CnisEcsService } from "./modules/services/ecs-service";
import { getEnvContext } from "./helper";
import { FargateTaskDefinition, ICluster } from "@aws-cdk/aws-ecs";
import { ContainerDefinition } from "./modules/services/container-definition";
import { IRole } from "@aws-cdk/aws-iam";
import { IRepository } from "@aws-cdk/aws-ecr/lib/repository";
import { ILogGroup, LogGroup, RetentionDays } from "@aws-cdk/aws-logs";
import { AppLoadBalancer as CnisAlb } from "./modules/loadbalancer/alb";
import { parameterKeys } from "../params";

interface IAppStackProps extends StackProps {
  vpc: IVpc;
  parameters: Map<string, IParameter>;
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

    const { vpc, parameters, securityGroups, controlPlane } = props;
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

    //// FIXME: 今回作成したレポを使うように修正
    //const dummyRepos = Repository.fromRepositoryName(
    //  this,
    //  "dummy-repo",
    //  "sbcntr-backend"
    //);
    const param1 = parameters.get(parameterKeys.AppParams);
    if (!param1) {
      throw new Error("Param get error");
    }
    const containerParameters = {
      SSM_PARAM_TEST: param1,
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
