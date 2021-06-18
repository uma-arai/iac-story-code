#!/usr/bin/env node
import * as cdk from "@aws-cdk/core";
import { CnisInfraStack } from "../lib/infrastructure-stack";
import { AppStack } from "../lib/app-stack";
import constants from "../constants";
import { AppBaseStack } from "../lib/appbase-stack";

const app = new cdk.App();

try {
  const infra = new CnisInfraStack(app, `${constants.ServicePrefix}-infra`);

  const { vpc, securityGroupList, ecsTaskExecutionRole, cluster } = infra;
  const appbase = new AppBaseStack(app, `${constants.ServicePrefix}-app-base`);

  new AppStack(app, `${constants.ServicePrefix}-app`, {
    vpc,
    securityGroups: securityGroupList,
    controlPlane: {
      cluster,
      executionRole: ecsTaskExecutionRole,
      ...appbase,
    },
  });
} catch (e) {
  console.trace(e);
  throw e;
}

app.synth();
