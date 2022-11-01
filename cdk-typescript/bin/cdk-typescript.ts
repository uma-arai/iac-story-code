#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { CnisInfraStack } from "../lib/infrastructure-stack";
import { AppStack } from "../lib/app-stack";
import { env } from "../environment";
import { AppBaseStack } from "../lib/appbase-stack";

const app = new cdk.App();

try {
  const infra = new CnisInfraStack(app, `${env.global.servicePrefix}-infra`);

  const { vpc, securityGroupList, ecsTaskExecutionRole, cluster } = infra;
  const appbase = new AppBaseStack(app, `${env.global.servicePrefix}-app-base`);

  new AppStack(app, `${env.global.servicePrefix}-app`, {
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
