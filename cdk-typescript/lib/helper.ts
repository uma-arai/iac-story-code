import { Construct, Stack } from "@aws-cdk/core";
import { ICnisContext } from "../model";

export const getEnv = (scope: Construct, stage: string, key?: string): any => {
  if (!key) {
    return scope.node.tryGetContext(stage);
  }

  return scope.node.tryGetContext(stage)[key];
};

export const getEnvContext = (scope: Construct): ICnisContext => {
  const env: string = getEnv(scope, "env") || "dev";

  return getEnv(scope, env);
};
