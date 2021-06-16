#!/usr/bin/env node
import * as cdk from "@aws-cdk/core";
import { CnisInfraStack } from "../lib/infrastructure-app";
import { CnisManagementStack } from "../lib/management";

const app = new cdk.App();
//const context = getEnvContext(app);

try {
  new CnisManagementStack(app, "management");
  new CnisInfraStack(app, "infra");
  //new AppStack(app, 'app');
} catch (e) {
  console.trace(e);
  throw e;
}

app.synth();
