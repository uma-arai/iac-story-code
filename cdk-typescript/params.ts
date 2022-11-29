import { env } from "./environment";

export const parameterKeys = {
  AppParams: `${env.global.servicePrefix}-ssm-param-${env.global.servicePrefix}-app`,
};
