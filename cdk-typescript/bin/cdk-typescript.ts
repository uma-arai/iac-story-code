#!/usr/bin/env node
import * as cdk from "@aws-cdk/core";
import { CnisInfraStack } from "../lib/infrastructure-stack";
import { CnisManagementStack } from "../lib/management";
import { AppStack } from "../lib/app-stack";
import constants from "../constants";
import { AppBaseStack } from "../lib/appbase-stack";

const app = new cdk.App();
//const context = getEnvContext(app);

try {
  const iam = new CnisManagementStack(app, "management");
  const infra = new CnisInfraStack(app, "infra");

  const { vpc, parameters, securityGroupList } = infra;
  const appbase = new AppBaseStack(app, `${constants.ServicePrefix}-app-base`, {
    vpc,
    securityGroups: securityGroupList,
  });

  new AppStack(app, `${constants.ServicePrefix}-app`, {
    vpc,
    parameters,
    securityGroups: securityGroupList,
    controlPlane: {
      cluster: infra.cluster,
      executionRole: iam.ecsTaskExecutionRole,
      repository: appbase.repository,
      listener: appbase.lbInfo.listener,
      logGroup: appbase.logs,
    },
  });
} catch (e) {
  console.trace(e);
  throw e;
}

app.synth();
