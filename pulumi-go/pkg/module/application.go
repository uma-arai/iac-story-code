package module

import (
	"pulumi-go/pkg/resource"
	"pulumi-go/pkg/types"

	"github.com/pulumi/pulumi-aws/sdk/v4/go/aws/ecs"
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
		return
	}

	ssmApp := &resource.SsmForApp{
		Plm: a.Plm,
	}
	if err = ssmApp.CreateParameter(appId); err != nil {
		return
	}

	ecsApp := &resource.Ecs{
		Plm:           a.Plm,
		Cluster:       a.Infra.Ecs.Cluster,
		Ecr:           ecrApp.Repository,
		LogGroup:      cwApp.LogGroup,
		Parameter:     ssmApp.Parameter,
		SecurityGroup: a.Infra.Sg.PrivateApp,
		Service:       make(map[string]*ecs.Service),
		Subnets:       a.Infra.Vpc.SnPrivateApp,
		TargetGroup:   albApp.TargetGroup,
		TaskDef:       make(map[string]*ecs.TaskDefinition),
		TaskExecRole:  a.Infra.TaskExecRole,
	}
	if err = ecsApp.CreateTaskDefinition(appId); err != nil {
		return
	}
	if err = ecsApp.CreateService(appId); err != nil {
		return
	}

	return
}
