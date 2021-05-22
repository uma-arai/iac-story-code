package resource

import (
	"pulumi-go/pkg/types"

	"github.com/pulumi/pulumi-aws/sdk/v4/go/aws/ec2"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

// VpcMain holds attributes of Main VPC.
type VpcMain struct {
	Plm types.Pulumi
	Vpc *ec2.Vpc
	igw *ec2.InternetGateway
}

// CreateVpc creates main VPC resources.
func (v *VpcMain) CreateVpc() (err error) {
	vpcName := v.Plm.Cfg.CnisResourcePrefix + "-vpc-main"
	v.Vpc, err = ec2.NewVpc(v.Plm.Ctx, vpcName, &ec2.VpcArgs{
		CidrBlock:          pulumi.String("10.0.0.0/16"),
		EnableDnsHostnames: pulumi.Bool(true),
		EnableDnsSupport:   pulumi.Bool(true),
		Tags:               v.getTag(vpcName),
	})
	if err != nil {
		return
	}

	return
}

// CreateIgw creates Internet Gateway.
func (v *VpcMain) CreateIgw() (err error) {
	igwName := v.Plm.Cfg.CnisResourcePrefix + "-igw-main"
	v.igw, err = ec2.NewInternetGateway(v.Plm.Ctx, igwName, &ec2.InternetGatewayArgs{
		VpcId: v.Vpc.ID(),
		Tags:  v.getTag(igwName),
	}, pulumi.Parent(v.Vpc))
	if err != nil {
		return
	}

	return
}

// getTag returns AWS tag information for VPC resources.
func (v *VpcMain) getTag(name string) pulumi.StringMap {
	return pulumi.StringMap{
		"Name":    pulumi.String(name),
		"Project": pulumi.String(v.Plm.Cfg.CnisProjectName),
	}
}
