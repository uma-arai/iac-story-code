import * as cdk from "aws-cdk-lib";
import { ContainerRepository } from "./modules/repository/ecr";
import constants from "../constants";
import { ILogGroup, LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { RemovalPolicy, Tags } from "aws-cdk-lib";
import { IRepository } from "aws-cdk-lib/aws-ecr";

export class AppBaseStack extends cdk.Stack {
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
