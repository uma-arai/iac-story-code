import { Construct } from "@aws-cdk/core";
import { getEnvContext } from "../../helper";
import { IRepository } from "@aws-cdk/aws-ecr/lib/repository";
import {
  ContainerDefinition as EcsContainerDefinition,
  ContainerImage,
  LogDriver,
  Protocol,
  Secret,
  TaskDefinition as EcsTaskDefinition,
} from "@aws-cdk/aws-ecs";
import { ILogGroup } from "@aws-cdk/aws-logs";
import { IContainerSecretList } from "../../../model";

interface IContainerDefinitionProps {
  repository: IRepository;
  parameterMap: IContainerSecretList;
  taskDefinition: EcsTaskDefinition;
  logGroup: ILogGroup;
}

export class ContainerDefinition extends Construct {
  constructor(scope: Construct, id: string, props: IContainerDefinitionProps) {
    super(scope, id);
    const { containerCpu, containerMemory } =
      getEnvContext(scope).serviceParameters;
    const { repository, taskDefinition, parameterMap, logGroup } = props;

    const secrets: {
      [p: string]: Secret;
    } = {};
    for (const key in parameterMap) {
      secrets[key] = Secret.fromSsmParameter(parameterMap[key]);
    }

    const containerDef = new EcsContainerDefinition(
      this,
      `ecs-container-definition`,
      {
        image: ContainerImage.fromEcrRepository(repository, "init"),
        memoryReservationMiB: containerMemory,
        cpu: containerCpu,
        logging: LogDriver.awsLogs({
          streamPrefix: "ecs",
          // WARNING: ここでロググループを作ろうとするとecsTaskExecutionロールにlogs:createLogGroupの権限を追加しに行く動きになる
          // その場合、managementスタック→appスタックに依存するようになり、
          // 循環参照がおこってエラーとなるため注意
          //new logs.LogGroup(this, `${constants.ServicePrefix}-logs`, {
          //  logGroupName: `${constants.ServicePrefix}-ecs-container-logs`,
          //}),
          logGroup,
        }),
        secrets,
        taskDefinition,
      }
    );
    containerDef.addPortMappings({
      hostPort: 80,
      protocol: Protocol.TCP,
      containerPort: 80,
    });
  }
}
