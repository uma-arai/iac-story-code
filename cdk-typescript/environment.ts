const ENV_NAMES = ["dev", "stg", "prd"] as const;
type EnvType = typeof ENV_NAMES[number];

type EnvParamType = {
  global: {
    servicePrefix: string;
    projectName: string;
  };
  cluster: {
    desiredCount: 1 | 2 | 4;
    taskCpu: number;
    taskMemory: number;
    containerCpu: number;
    containerMemory: number;
  };
};

const commonParam: EnvParamType = {
  global: {
    servicePrefix: "cnis",
    projectName: "CloudNativeIaCStory",
  },
  cluster: {
    desiredCount: 1,
    taskCpu: 256,
    taskMemory: 512,
    containerCpu: 256,
    containerMemory: 512,
  },
};

const envName: EnvType = (process.env.DEPLOY_ENV as EnvType) || "dev";
if (!ENV_NAMES.includes(envName)) {
  throw Error(`Invalid env name specified ${envName}`);
}

const envParamMap: Record<EnvType, EnvParamType> = {
  dev: {
    ...commonParam,
  },
  stg: {
    ...commonParam,
    cluster: {
      ...commonParam.cluster,
      desiredCount: 2,
    },
  },
  prd: {
    ...commonParam,
    cluster: {
      ...commonParam.cluster,
      desiredCount: 2,
    },
  },
};

export const env = envParamMap[envName];
