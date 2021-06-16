import { Construct } from "@aws-cdk/core";
import { getEnvContext } from "../../helper";
import { IRepository } from "@aws-cdk/aws-ecr/lib/repository";
import { IParameter } from "@aws-cdk/aws-ssm";
import {
  ContainerDefinition as EcsContainerDefinition,
  ContainerImage,
  LogDriver,
  Protocol,
  Secret,
  TaskDefinition as EcsTaskDefinition,
} from "@aws-cdk/aws-ecs";
import { ILogGroup } from "@aws-cdk/aws-logs";

interface IContainerDefinitionProps {
  repository: IRepository;
  parameterMap: Map<string, IParameter>;
  taskDefinition: EcsTaskDefinition;
  logGroup: ILogGroup;
}

export class ContainerDefinition extends Construct {
  constructor(scope: Construct, id: string, props: IContainerDefinitionProps) {
    super(scope, id);
    const { containerCpu, containerMemory } =
      getEnvContext(scope).serviceParameters;
    const { repository, parameterMap, taskDefinition, logGroup } = props;

    const parameter = parameterMap.get("cnis-ssm-param-cnis-app");
    if (!parameter) {
      throw new Error("No parameter found");
    }

    const containerDef = new EcsContainerDefinition(
      this,
      `ecs-container-definition`,
      {
        //FIXME: ${ResourcePrefix}-ecr-app:initに置き換え
        image: ContainerImage.fromEcrRepository(repository, "v1"),
        memoryReservationMiB: containerMemory,
        cpu: containerCpu,
        logging: LogDriver.awsLogs({
          streamPrefix: "ecs",
          logGroup,
          // WARNING: ここでロググループを作ろうとするとecsTaskExecutionロールにlogs:createLogGroupの権限を追加しに行く動きになる
          // その場合、managementスタック→appスタックに依存するようになり、
          // 循環参照がおこってエラーとなるため注意
          //new logs.LogGroup(this, `${constants.ServicePrefix}-logs`, {
          //  logGroupName: `${constants.ServicePrefix}-ecs-container-logs`,
          //}),
        }),
        secrets: {
          SSM_PARAM_TEST: Secret.fromSsmParameter(parameter),
        },
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
