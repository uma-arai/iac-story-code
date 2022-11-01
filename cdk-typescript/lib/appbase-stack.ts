import * as cdk from "aws-cdk-lib";
import { ContainerRepository } from "./modules/repository/ecr";

import { ILogGroup, LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { RemovalPolicy, Tags } from "aws-cdk-lib";
import { IRepository } from "aws-cdk-lib/aws-ecr";
import { env } from "../environment";

export class AppBaseStack extends cdk.Stack {
  readonly repository: IRepository;
  readonly logGroup: ILogGroup;

  constructor(scope: cdk.App, id: string) {
    super(scope, id);

    Tags.of(this).add("Project", env.global.projectName);

    // ECR
    this.repository = new ContainerRepository(
      this,
      `${env.global.servicePrefix}-repository`,
      {}
    ).repository;

    // Logs
    this.logGroup = new LogGroup(this, `${env.global.servicePrefix}-logs-app`, {
      logGroupName: `${env.global.servicePrefix}-logs-app`,
      retention: RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }
}
