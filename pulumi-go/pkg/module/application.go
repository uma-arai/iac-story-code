package module

import (
	"pulumi-go/pkg/resource"
	"pulumi-go/pkg/types"
)

// Application holds attribute to create AWS application layer's resources.
type Application struct {
	Plm   types.Pulumi
	Infra *Infrastructure
}

// CreateApplication create AWS application layer's resources.
func (a *Application) CreateApplication() (err error) {
	ecrApp := &resource.Ecr{
		Plm: a.Plm,
	}
	if err = ecrApp.CreateEcr("app"); err != nil {
		return
	}

	return
}
