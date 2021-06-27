import {
  ISecurityGroup,
  IVpc,
  Peer,
  Port,
  SecurityGroup,
} from "@aws-cdk/aws-ec2";
import { Construct, Tags } from "@aws-cdk/core";
import { SecurityGroupProps } from "@aws-cdk/aws-ec2/lib/security-group";
import constants from "../../../constants";
import { SecurityGroupNameType } from "../../../model";

type SgType = Pick<SecurityGroupProps, "securityGroupName" | "description">;
type SecurityGroupsIds = {
  [key: string]: SgType;
};

interface IProps {
  vpc: IVpc;
}

export class SecurityGroups extends Construct {
  readonly securityGroups: Map<string, ISecurityGroup>;

  constructor(scope: Construct, id: string, props: IProps) {
    super(scope, id);

    const { vpc } = props;
    this.securityGroups = new Map<string, ISecurityGroup>();

    // モジュールで作成するセキュリティグループ
    const data: SecurityGroupsIds = {
      ingress: {
        securityGroupName: `${constants.ServicePrefix}-sg-public-ingress`,
        description: "HTTP for ingress",
      },
      egress: {
        securityGroupName: `${constants.ServicePrefix}-sg-private-egress`,
        description: "HTTPS for vpc endpoint",
      },
      app: {
        securityGroupName: `${constants.ServicePrefix}-sg-private-app`,
        description: "HTTP for app",
      },
    };

    Object.entries<SgType>(data).map(([key, inputs]) => {
      const sg = new SecurityGroup(this, key, {
        ...inputs,
        vpc,
      });
      Tags.of(sg).add(
        "Name",
        inputs.securityGroupName || constants.ServicePrefix
      );
      this.securityGroups.set(key, sg);
    });

    // Same as sgIngress.addIngressRule(Peer.anyIpv4(), Port.tcp(80));
    const sgIngress = this.securityGroups.get(SecurityGroupNameType.ingress);
    const sgApp = this.securityGroups.get(SecurityGroupNameType.app);

    if (!sgIngress || !sgApp) {
      throw new Error(`Security group should not be empty`);
    }

    sgIngress.connections.allowFromAnyIpv4(Port.tcp(80));
    sgIngress.addIngressRule(Peer.anyIpv6(), Port.tcp(80));
    sgApp.connections.allowFrom(sgIngress, Port.tcp(80), "HTTP for Ingress");
    this.securityGroups
      .get(SecurityGroupNameType.vpce)
      ?.connections.allowFrom(sgApp, Port.tcp(443), "HTTPS for app");
  }
}
