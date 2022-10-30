import { getEnvContext } from "../../helper";
import { IContainerSecretList } from "../../../model";
import { ILogGroup } from "aws-cdk-lib/aws-logs";
import {
  ContainerImage,
  LogDriver,
  Secret,
  TaskDefinition,
  ContainerDefinition as EcsContainerDefinition,
  Protocol,
} from "aws-cdk-lib/aws-ecs";
import { Construct } from "constructs";
import { IRepository } from "aws-cdk-lib/aws-ecr";

interface IContainerDefinitionProps {
  repository: IRepository;
  parameterMap: IContainerSecretList;
  taskDefinition: TaskDefinition;
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
