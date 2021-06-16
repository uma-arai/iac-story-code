import { Construct, Stack, Tags } from "@aws-cdk/core";
import constants from "../constants";
import { IRole } from "@aws-cdk/aws-iam";
import { Iam as BaseIam } from "./modules/foundation/iam";

export class CnisManagementStack extends Stack {
  readonly ecsTaskExecutionRole: IRole;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    Tags.of(this).add("Project", constants.ProjectName);
    const iam = new BaseIam(this, "iam");
    this.ecsTaskExecutionRole = iam.ecsTaskExecutionRole;
  }
}
