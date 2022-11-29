import { env } from "../../../environment";
import {
  Effect,
  IRole,
  ManagedPolicy,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export class Iam extends Construct {
  readonly ecsTaskExecutionRole: IRole;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // NOTE: AWS側で用意されているマネージドポリシーであるAWSCodeDeployRoleForECSLimitedが
    // iam::PassRoleできるリソースがecsTaskExecutionRoleであるため。
    // AWSCodeDeployRoleForECSLimitedを使う場合は名前はecsTaskExecutionRoleかECSTaskExecution*にしておく必要がある。
    // AWSCodeDeployRoleForECSを使うなら問題なし
    // 今回はAmazonECSTaskExecutionRolePolicyなので問題なし
    const ecsTaskExecutionRole = new Role(
      this,
      `${env.global.servicePrefix}-ecs-task-execution-role`,
      {
        roleName: `${env.global.servicePrefix}EcsTaskExecutionRole`,
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
      managedPolicyName: `${env.global.servicePrefix}-GetParameterStorePolicy`,
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
