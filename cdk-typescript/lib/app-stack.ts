import * as cdk from "@aws-cdk/core";
import { Stack, StackProps, Tags } from "@aws-cdk/core";
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
import { Repository } from "@aws-cdk/aws-ecr";
import { IApplicationListener } from "@aws-cdk/aws-elasticloadbalancingv2";
import { ILogGroup } from "@aws-cdk/aws-logs";

interface IAppStackProps extends StackProps {
  vpc: IVpc;
  parameters: Map<string, IParameter>;
  securityGroups: Map<string, ISecurityGroup>;
  controlPlane: {
    cluster: ICluster;
    executionRole: IRole;
    repository: IRepository;
    listener: IApplicationListener;
    //targetGroup: ITargetGroup;
    logGroup: ILogGroup;
  };
}

export class AppStack extends Stack {
  constructor(scope: cdk.App, id: string, props: IAppStackProps) {
    super(scope, id, props);

    const { vpc, parameters, securityGroups, controlPlane } = props;
    const { executionRole, cluster, logGroup, listener } = controlPlane;

    Tags.of(this).add("Project", constants.ProjectName);

    const { taskCpu, taskMemory } = getEnvContext(this).serviceParameters;
    // タスク定義の作成
    const taskDefinition = new FargateTaskDefinition(this, `ecs-taskdef`, {
      memoryLimitMiB: taskMemory,
      cpu: taskCpu,
      executionRole,

      family: `${constants.ServicePrefix}-ecs-taskdef-app`,
    });

    // コンテナ定義の作成

    // FIXME: 今回作成したレポを使うように修正
    const dummyRepos = Repository.fromRepositoryName(
      this,
      "dummy-repo",
      "sbcntr-backend"
    );
    new ContainerDefinition(this, `ecs-container-def`, {
      repository: dummyRepos,
      parameterMap: parameters,
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
      listener,
    });
  }
}
