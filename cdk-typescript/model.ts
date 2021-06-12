export interface ICnisContext {
  name: string;
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
