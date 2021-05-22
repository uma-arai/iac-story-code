package module

import (
	"pulumi-go/pkg/resource"
	"pulumi-go/pkg/types"
)

// Infrastructure holds attribute to create AWS foundation resources.
type Infrastructure struct {
	Plm types.Pulumi
}

// CreateInfrastructure create AWS foundation resources.
func (i *Infrastructure) CreateInfrastructure() (err error) {
	vpcMain := &resource.VpcMain{
		Plm:             i.Plm,
		SnPublicIngress: make(map[string]resource.SubnetInfo),
	}
	if err = vpcMain.CreateVpc(); err != nil {
		return
	}
	if err = vpcMain.CreateIgw(); err != nil {
		return
	}
	if err = vpcMain.CreateCommonRouteTable(); err != nil {
		return
	}
	if err = vpcMain.CreatePublicSubnetIngress("a", "10.0.0.0/24"); err != nil {
		return
	}

	return
}
