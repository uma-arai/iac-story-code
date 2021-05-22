package resource

import (
	"pulumi-go/pkg/types"

	"github.com/pulumi/pulumi-aws/sdk/v4/go/aws/ec2"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

// VpcMain holds attributes of Main VPC.
type VpcMain struct {
	Plm types.Pulumi
	vpc *ec2.Vpc
}

// CreateVpc create main VPC resources.
func (v *VpcMain) CreateVpc() (err error) {
	vpcName := v.Plm.Cfg.CnisResourcePrefix + "-vpc-main"
	v.vpc, err = ec2.NewVpc(v.Plm.Ctx, vpcName, &ec2.VpcArgs{
		CidrBlock:          pulumi.String("10.0.0.0/16"),
		EnableDnsHostnames: pulumi.Bool(true),
		EnableDnsSupport:   pulumi.Bool(true),
		Tags: pulumi.StringMap{
			"Name":    pulumi.String(vpcName),
			"Project": pulumi.String(v.Plm.Cfg.CnisProjectName),
		},
	})
	if err != nil {
		return
	}

	return
}
