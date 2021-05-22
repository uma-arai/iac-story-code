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
		Plm: i.Plm,
	}
	if err = vpcMain.CreateVpc(); err != nil {
		return err
	}
	if err = vpcMain.CreateIgw(); err != nil {
		return
	}

	return
}
