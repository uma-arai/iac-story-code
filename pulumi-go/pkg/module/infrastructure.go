package module

import (
	"pulumi-go/pkg/resource"
	"pulumi-go/pkg/types"

	"github.com/pulumi/pulumi-aws/sdk/v4/go/aws/ecs"
)

// Infrastructure holds attribute to create AWS foundation resources.
type Infrastructure struct {
	Plm types.Pulumi
	Vpc resource.VpcMain
	Ecs resource.Ecs
}

// CreateInfrastructure create AWS foundation resources.
func (i *Infrastructure) CreateInfrastructure() (err error) {
	vpcMain := &resource.VpcMain{
		Plm:             i.Plm,
		SnPublicIngress: make(map[string]*resource.SubnetInfo),
		SnPrivateApp:    make(map[string]*resource.SubnetInfo),
		SnPrivateEgress: make(map[string]*resource.SubnetInfo),
	}
	if err = vpcMain.CreateVpc(); err != nil {
		return
	}
	if err = vpcMain.CreateIgw(); err != nil {
		return
	}
	if err = vpcMain.CreateS3VpcEndpoint(); err != nil {
		return
	}

	if err = vpcMain.CreatePublicRouteTable(); err != nil {
		return
	}
	if err = vpcMain.CreateInternalRouteTable(); err != nil {
		return
	}

	if err = vpcMain.CreatePublicSubnetIngress("a", "10.0.0.0/24"); err != nil {
		return
	}
	if err = vpcMain.CreatePrivateSubnetApp("a", "10.0.8.0/24"); err != nil {
		return
	}
	if err = vpcMain.CreatePrivateSubnetEgress("a", "10.0.240.0/24"); err != nil {
		return
	}

	ecsApp := &resource.Ecs{
		Plm:     i.Plm,
		Cluster: make(map[string]*ecs.Cluster),
	}
	if err = ecsApp.CreateEcsCluster("app"); err != nil {
		return
	}

	return
}
