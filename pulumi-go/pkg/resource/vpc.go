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
	vpceS3          *ec2.VpcEndpoint
	SnPublicIngress map[string]*SubnetInfo
	SnPrivateApp    map[string]*SubnetInfo
	SnPrivateEgress map[string]*SubnetInfo
	rtPublic        *routeTableInfo
	rtPrivate       *routeTableInfo
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

// CreatePublicRouteTable creates route table for subnet to access internet.
func (v *VpcMain) CreatePublicRouteTable() (err error) {
	routeId := "public"
	rtName := v.Plm.Cfg.CnisResourcePrefix + "-rt-" + routeId
	rt, err := ec2.NewRouteTable(v.Plm.Ctx, rtName, &ec2.RouteTableArgs{
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
	v.rtPublic = &routeTableInfo{
		routeId:    routeId,
		routeTable: rt,
	}

	return
}

// CreateS3VpcEndpoint create VPC Endpoint toward S3.
func (v *VpcMain) CreateS3VpcEndpoint() (err error) {
	vpceName := v.Plm.Cfg.CnisResourcePrefix + "-vpce-s3"
	v.vpceS3, err = ec2.NewVpcEndpoint(v.Plm.Ctx, vpceName, &ec2.VpcEndpointArgs{
		ServiceName:     pulumi.String("com.amazonaws." + v.Plm.Cfg.AwsRegion + ".s3"),
		VpcId:           v.Vpc.ID(),
		Tags:            v.getTag(vpceName),
		VpcEndpointType: pulumi.String("Gateway"),
	}, pulumi.Parent(v.Vpc))
	if err != nil {
		return
	}

	return
}

// CreateInternalRouteTable creates route table for the purpose of internal use.
func (v *VpcMain) CreateInternalRouteTable() (err error) {
	routeId := "internal"
	rtName := v.Plm.Cfg.CnisResourcePrefix + "-rt-" + routeId
	rt, err := ec2.NewRouteTable(v.Plm.Ctx, rtName, &ec2.RouteTableArgs{
		VpcId: v.Vpc.ID(),
		// TODO: add route list of VPC endpoint after creating it.
		Tags: v.getTag(rtName),
	}, pulumi.Parent(v.Vpc))
	if err != nil {
		return
	}

	rtVpceName := v.Plm.Cfg.CnisResourcePrefix + "-rta-" + routeId + "-vpce-s3"
	_, err = ec2.NewVpcEndpointRouteTableAssociation(v.Plm.Ctx, rtVpceName, &ec2.VpcEndpointRouteTableAssociationArgs{
		RouteTableId:  rt.ID(),
		VpcEndpointId: v.vpceS3.ID(),
	}, pulumi.Parent(rt))
	if err != nil {
		return
	}

	v.rtPrivate = &routeTableInfo{
		routeId:    routeId,
		routeTable: rt,
	}

	return
}

// associateIgwWithRouteTable associates subnet with route table.
func (v *VpcMain) associateWithRouteTable(rt *routeTableInfo, sn *SubnetInfo) (err error) {
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
	subnetInfo, err := v.createSubnet(subnetId, azId, cidr)
	if err != nil {
		return
	}
	v.SnPublicIngress[azId] = subnetInfo

	if err = v.associateWithRouteTable(v.rtPublic, subnetInfo); err != nil {
		return
	}

	return
}

// CreatePrivateSubnetApp create private subnet for application.
func (v *VpcMain) CreatePrivateSubnetApp(azId string, cidr string) (err error) {
	subnetId := "private-app-" + azId
	subnetInfo, err := v.createSubnet(subnetId, azId, cidr)
	if err != nil {
		return
	}
	v.SnPrivateApp[azId] = subnetInfo

	if err = v.associateWithRouteTable(v.rtPrivate, subnetInfo); err != nil {
		return
	}

	return
}

// CreatePrivateSubnetEgress create private subnet for egress resources.
func (v *VpcMain) CreatePrivateSubnetEgress(azId string, cidr string) (err error) {
	subnetId := "private-egress-" + azId
	subnetInfo, err := v.createSubnet(subnetId, azId, cidr)
	if err != nil {
		return
	}
	v.SnPrivateEgress[azId] = subnetInfo

	return
}

// createSubnet is private function to create subnet.
func (v *VpcMain) createSubnet(subnetId string, azId string, cidr string) (snInfo *SubnetInfo, err error) {
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

	snInfo = &SubnetInfo{
		azId:     azId,
		subnetId: subnetId,
		subnet:   subnet,
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
