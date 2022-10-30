import { ICnisContext } from "../model";
import { Construct } from "constructs";

/**
 *
 * @param {Construct} scope
 * @param {string} stage
 * @param {string} key
 * @returns {any}
 */
export const getEnv = (scope: Construct, stage: string, key?: string): any => {
  if (!key) {
    return scope.node.tryGetContext(stage);
  }

  return scope.node.tryGetContext(stage)[key];
};

/**
 *
 * @param {Construct} scope
 * @returns {ICnisContext}
 */
export const getEnvContext = (scope: Construct): ICnisContext => {
  const env: string = getEnv(scope, "env") || "dev";

  return getEnv(scope, env);
};

/**
 * Returns validation result of IP address
 * @export
 * @param {string} ip
 * @returns {boolean}
 */
export const validateIpRange = (ip: string): boolean => {
  const regIpExp = new RegExp("^(?:[0-9]{1,3}\\.){3}[0-9]{1,3}$");

  return regIpExp.test(ip);
};
