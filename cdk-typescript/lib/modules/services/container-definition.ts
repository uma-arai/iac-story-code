import { IContainerSecretList } from "../../../model";
import { ILogGroup } from "aws-cdk-lib/aws-logs";
import {
  ContainerDefinition as EcsContainerDefinition,
  ContainerImage,
  LogDriver,
  Protocol,
  Secret,
  TaskDefinition,
} from "aws-cdk-lib/aws-ecs";
import { Construct } from "constructs";
import { IRepository } from "aws-cdk-lib/aws-ecr";
import { env } from "../../../environment";

interface IContainerDefinitionProps {
  repository: IRepository;
  parameterMap: IContainerSecretList;
  taskDefinition: TaskDefinition;
  logGroup: ILogGroup;
}

export class ContainerDefinition extends Construct {
  constructor(scope: Construct, id: string, props: IContainerDefinitionProps) {
    super(scope, id);
    const { containerCpu, containerMemory } = env.cluster;
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
          //new logs.LogGroup(this, `${env.global.servicePrefix}-logs`, {
          //  logGroupName: `${env.global.servicePrefix}-ecs-container-logs`,
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
