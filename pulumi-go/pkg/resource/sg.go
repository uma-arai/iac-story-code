package resource

import (
	"pulumi-go/pkg/types"

	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"

	"github.com/pulumi/pulumi-aws/sdk/v4/go/aws/ec2"
)

// SecurityGroup holds attributes about Security Group.
type SecurityGroup struct {
	Plm           types.Pulumi
	Vpc           *ec2.Vpc
	PublicIngress *ec2.SecurityGroup
	PrivateApp    *ec2.SecurityGroup
	PrivateEgress *ec2.SecurityGroup
}

// CreateSecurityGroupPublicIngress creates Security Group for public ingress resources.
func (s *SecurityGroup) CreateSecurityGroupPublicIngress() (err error) {
	sgName := s.Plm.Cfg.CnisResourcePrefix + "-sg-public-ingress"
	s.PublicIngress, err = ec2.NewSecurityGroup(s.Plm.Ctx, sgName, &ec2.SecurityGroupArgs{
		Ingress: ec2.SecurityGroupIngressArray{
			&ec2.SecurityGroupIngressArgs{
				CidrBlocks: pulumi.StringArray{
					pulumi.String("0.0.0.0/0"),
				},
				FromPort: pulumi.Int(80),
				ToPort:   pulumi.Int(80),
				Protocol: pulumi.String("tcp"),
			},
		},
		Tags:  s.getTagWithName(sgName),
		VpcId: s.Vpc.ID(),
	})
	if err != nil {
		return
	}

	return
}

// CreateSecurityGroupPrivateApp creates Security Group for private applications.
func (s *SecurityGroup) CreateSecurityGroupPrivateApp() (err error) {
	sgName := s.Plm.Cfg.CnisResourcePrefix + "-sg-private-app"
	s.PrivateApp, err = ec2.NewSecurityGroup(s.Plm.Ctx, sgName, &ec2.SecurityGroupArgs{
		Ingress: ec2.SecurityGroupIngressArray{
			&ec2.SecurityGroupIngressArgs{
				SecurityGroups: pulumi.StringArray{
					s.PublicIngress.ID(),
				},
				FromPort: pulumi.Int(80),
				ToPort:   pulumi.Int(80),
				Protocol: pulumi.String("tcp"),
			},
		},
		Tags:  s.getTagWithName(sgName),
		VpcId: s.Vpc.ID(),
	})
	if err != nil {
		return
	}

	return
}

// CreateSecurityGroupPrivateEgress creates Security Group for private egress resources.
func (s *SecurityGroup) CreateSecurityGroupPrivateEgress() (err error) {
	sgName := s.Plm.Cfg.CnisResourcePrefix + "-sg-private-egress"
	s.PrivateEgress, err = ec2.NewSecurityGroup(s.Plm.Ctx, sgName, &ec2.SecurityGroupArgs{
		Ingress: ec2.SecurityGroupIngressArray{
			&ec2.SecurityGroupIngressArgs{
				SecurityGroups: pulumi.StringArray{
					s.PrivateApp.ID(),
				},
				FromPort: pulumi.Int(443),
				ToPort:   pulumi.Int(443),
				Protocol: pulumi.String("tcp"),
			},
		},
		Tags:  s.getTagWithName(sgName),
		VpcId: s.Vpc.ID(),
	})
	if err != nil {
		return
	}

	return
}

// getTagWithName returns AWS tag information for Security Group resources.
func (s *SecurityGroup) getTagWithName(name string) pulumi.StringMap {
	return pulumi.StringMap{
		"Name":    pulumi.String(name),
		"Project": pulumi.String(s.Plm.Cfg.CnisProjectName),
	}
}
