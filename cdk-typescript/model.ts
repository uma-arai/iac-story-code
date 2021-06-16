export interface ICnisContext {
  ecs: {
    lbPriority: number;
    desiredCount: number;
    taskCpu: number;
    taskMemory: number;
    containerCpu: number;
    containerMemory: number;
    autoscalingMinCap: number;
    autoscalingMaxCap: number;
  };
}

export const SecurityGroupNameType = {
  ingress: "ingress",
  app: "app",
  vpce: "egress",
} as const;

export type SecurityGroupNameType =
  typeof SecurityGroupNameType[keyof typeof SecurityGroupNameType];
