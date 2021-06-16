export interface ICnisContext {
  serviceParameters: {
    desiredCount: number;
    taskCpu: number;
    taskMemory: number;
    containerCpu: number;
    containerMemory: number;
  };
}

export const SecurityGroupNameType = {
  ingress: "ingress",
  app: "app",
  vpce: "egress",
} as const;

//eslint-disable-next-line no-redeclare
export type SecurityGroupNameType =
  typeof SecurityGroupNameType[keyof typeof SecurityGroupNameType];
