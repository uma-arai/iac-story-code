import * as cdk from "@aws-cdk/core";
import {
  Effect,
  IRole,
  ManagedPolicy,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "@aws-cdk/aws-iam";
import { getEnvContext } from "../../helper";

export class Iam extends cdk.Construct {
  readonly ecsTaskExecutionRole: IRole;

  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);

    const prefix = getEnvContext(scope).name;

    // NOTE: 名前はecsTaskExecutionRoleかECSTaskExecution*にしておく必要がある。
    // AWS側で用意されているマネージドポリシーであるAWSCodeDeployRoleForECSLimitedが
    // iam::PassRoleできるリソースがecsTaskExecutionRoleであるため。
    // AWSCodeDeployRoleForECSを使うなら問題なし
    const ecsTaskExecutionRole = new Role(
      this,
      `${prefix}-ecs-task-execution-role`,
      {
        roleName: `${prefix}EcsTaskExecutionRole`,
        assumedBy: new ServicePrincipal("ecs-tasks"),
      }
    );
    ecsTaskExecutionRole.addManagedPolicy({
      managedPolicyArn:
        "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
    });

    new ManagedPolicy(this, "ssm-policy", {
      // WARNING: Descriptionを指定しておかないとDrift detectionにひっかかるので注意
      description: "Getting parameters in ssm parameter store for ECS",
      managedPolicyName: `${prefix}-GetParameterStorePolicy`,
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ["ssm:GetParameters"],
          resources: ["*"],
        }),
      ],
      roles: [ecsTaskExecutionRole],
    });

    this.ecsTaskExecutionRole = ecsTaskExecutionRole;
  }
}
