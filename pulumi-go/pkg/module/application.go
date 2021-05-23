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

// CreateApplications creates all applications.
func (a *Application) CreateApplications() (err error) {
	appIds := []string{
		"app",
	}
	for _, id := range appIds {
		if err = a.createApplication(id); err != nil {
			return
		}
	}

	return
}

// createApplication creates AWS application layer's resources associated with application ID.
func (a *Application) createApplication(appId string) (err error) {
	ecrApp := &resource.Ecr{
		Plm: a.Plm,
	}
	if err = ecrApp.CreateEcr(appId); err != nil {
		return
	}

	cwApp := &resource.CloudWatchForApp{
		Plm: a.Plm,
	}
	if err = cwApp.CreateLogGroup(appId); err != nil {
		return
	}

	albCommon := resource.NewAlb(a.Plm, a.Infra.Vpc.Vpc, a.Infra.Sg.PublicIngress, a.Infra.Vpc.SnPublicIngress)
	albApp := &resource.AlbForApp{
		AlbCommon: albCommon,
	}
	if err = albApp.CreateAlb(appId); err != nil {
		return err
	}

	return
}
