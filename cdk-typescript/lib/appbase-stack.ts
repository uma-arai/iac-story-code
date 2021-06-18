import * as cdk from "@aws-cdk/core";
import { RemovalPolicy, Stack, Tags } from "@aws-cdk/core";
import { ContainerRepository } from "./modules/repository/ecr";
import constants from "../constants";
import { IRepository } from "@aws-cdk/aws-ecr/lib/repository";
import { ILogGroup, LogGroup, RetentionDays } from "@aws-cdk/aws-logs";

export class AppBaseStack extends Stack {
  readonly repository: IRepository;
  readonly logGroup: ILogGroup;

  constructor(scope: cdk.App, id: string) {
    super(scope, id);

    Tags.of(this).add("Project", constants.ProjectName);

    // ECR
    this.repository = new ContainerRepository(
      this,
      `${constants.ServicePrefix}-repository`,
      {}
    ).repository;

    // Logs
    this.logGroup = new LogGroup(this, `${constants.ServicePrefix}-logs-app`, {
      logGroupName: `${constants.ServicePrefix}-logs-app`,
      retention: RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }
}
