import * as cdk from "@aws-cdk/core";
import { RemovalPolicy, Stack, StackProps, Tags } from "@aws-cdk/core";
import { ContainerRepository } from "./modules/repository/ecr";
import constants from "../constants";
import { ILogGroup, LogGroup, RetentionDays } from "@aws-cdk/aws-logs";
import { AppLoadBalancer as CnisAlb } from "./modules/loadbalancer/alb";
import { ISecurityGroup, IVpc } from "@aws-cdk/aws-ec2";
import { SecurityGroupNameType } from "../model";
import { IRepository } from "@aws-cdk/aws-ecr/lib/repository";
import {
  IApplicationListener,
  IApplicationLoadBalancer,
  ITargetGroup,
} from "@aws-cdk/aws-elasticloadbalancingv2";

type LoadBalancerInformation = {
  readonly alb: IApplicationLoadBalancer;
  readonly targetGroup: ITargetGroup;
  readonly listener: IApplicationListener;
};

interface IAppBaseStackProps extends StackProps {
  vpc: IVpc;
  securityGroups: Map<string, ISecurityGroup>;
}

// TODO: 全般。モジュールに対しては名前のプレフィックスはpropsとしてDIするように書き換える
export class AppBaseStack extends Stack {
  readonly repository: IRepository;
  readonly lbInfo: LoadBalancerInformation;
  readonly logs: ILogGroup;

  constructor(scope: cdk.App, id: string, props: IAppBaseStackProps) {
    super(scope, id, props);

    const { vpc, securityGroups } = props;

    Tags.of(this).add("Project", constants.ProjectName);

    // ECR
    this.repository = new ContainerRepository(
      this,
      `${constants.ServicePrefix}-repository`,
      {
        name: `${constants.ServicePrefix}-ecr-app`,
      }
    ).repository;

    // Logs
    this.logs = new LogGroup(this, `${constants.ServicePrefix}-logs-app`, {
      logGroupName: `${constants.ServicePrefix}-logs-app`,
      retention: RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // ALB
    const securityGroup = securityGroups.get(SecurityGroupNameType.ingress);
    if (!securityGroup) {
      throw new Error("No alb security group is set");
    }
    this.lbInfo = new CnisAlb(this, `${constants.ServicePrefix}-alb`, {
      vpc,
      securityGroup,
    });
  }
}
