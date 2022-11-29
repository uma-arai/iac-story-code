import { env } from "../../environment";
import { IParameter, StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

export interface IParameterTypes {
  [key: string]: string;
}

export class Parameter extends Construct {
  readonly parameters: Map<string, IParameter>;
  constructor(scope: Construct, id: string, props: IParameterTypes) {
    super(scope, id);

    this.parameters = new Map<string, IParameter>();
    const prefix = env.global.servicePrefix;
    Object.entries(props).map(([key, stringValue]) => {
      const param = new StringParameter(this, `${prefix}-${key}`, {
        parameterName: key,
        stringValue,
      });

      this.parameters.set(key, param);
    });
  }
}
