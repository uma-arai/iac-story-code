package resource

import (
	"pulumi-go/pkg/types"

	"github.com/pulumi/pulumi-aws/sdk/v4/go/aws/ec2"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

// routeTableInfo holds information of route table.
type routeTableInfo struct {
	routeId    string
	routeTable *ec2.RouteTable
}

// SubnetInfo holds information of subnet.
type SubnetInfo struct {
	azId     string
	subnetId string
	subnet   *ec2.Subnet
}

// VpcMain holds attributes of Main VPC.
type VpcMain struct {
	Plm             types.Pulumi
	Vpc             *ec2.Vpc
	igw             *ec2.InternetGateway
	SnPublicIngress map[string]SubnetInfo
	rtCommon        routeTableInfo
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

// CreateCommonRouteTable creates common route table.
func (v *VpcMain) CreateCommonRouteTable() (err error) {
	v.rtCommon.routeId = "common"
	rtName := v.Plm.Cfg.CnisResourcePrefix + "-rt-" + v.rtCommon.routeId
	v.rtCommon.routeTable, err = ec2.NewRouteTable(v.Plm.Ctx, rtName, &ec2.RouteTableArgs{
		VpcId: v.Vpc.ID(),
		Routes: ec2.RouteTableRouteArray{
			&ec2.RouteTableRouteArgs{
				CidrBlock: pulumi.String("0.0.0.0/0"),
				GatewayId: v.igw.ID(),
			},
		},
		Tags: v.getTag(rtName),
	}, pulumi.Parent(v.Vpc))
	if err != nil {
		return
	}

	return
}

// associateIgwWithRouteTable associates subnet with route table.
func (v *VpcMain) associateWithRouteTable(rt routeTableInfo, sn SubnetInfo) (err error) {
	name := v.Plm.Cfg.CnisResourcePrefix + "-rta-" + rt.routeId + "-" + sn.subnetId
	_, err = ec2.NewRouteTableAssociation(v.Plm.Ctx, name, &ec2.RouteTableAssociationArgs{
		SubnetId:     sn.subnet.ID(),
		RouteTableId: rt.routeTable.ID(),
	}, pulumi.Parent(rt.routeTable))
	if err != nil {
		return
	}

	return
}

// CreatePublicSubnetIngress create public subnet for ingress resources.
func (v *VpcMain) CreatePublicSubnetIngress(azId string, cidr string) (err error) {
	subnetId := "public-ingress-" + azId
	snName := v.Plm.Cfg.CnisResourcePrefix + "-subnet-" + subnetId
	subnet, err := ec2.NewSubnet(v.Plm.Ctx, snName, &ec2.SubnetArgs{
		CidrBlock:        pulumi.String(cidr),
		VpcId:            v.Vpc.ID(),
		AvailabilityZone: pulumi.String(v.Plm.Cfg.AwsRegion + azId),
		Tags:             v.getTag(snName),
	}, pulumi.Parent(v.Vpc), pulumi.DeleteBeforeReplace(true))
	if err != nil {
		return
	}
	subnetInfo := SubnetInfo{
		azId:     azId,
		subnetId: subnetId,
		subnet:   subnet,
	}
	v.SnPublicIngress[azId] = subnetInfo

	if err = v.associateWithRouteTable(v.rtCommon, subnetInfo); err != nil {
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
