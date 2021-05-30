package resource

import (
	"pulumi-go/pkg/types"

	"github.com/pulumi/pulumi-aws/sdk/v4/go/aws/ecr"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

// Ecr holds attribute for ECR.
type Ecr struct {
	Plm        types.Pulumi
	Repository *ecr.Repository
}

// CreateEcr create ECR resources.
func (e *Ecr) CreateEcr(appId string) (err error) {
	reposName := e.Plm.Cfg.CnisResourcePrefix + "-ecr-" + appId
	e.Repository, err = ecr.NewRepository(e.Plm.Ctx, reposName, &ecr.RepositoryArgs{
		ImageScanningConfiguration: &ecr.RepositoryImageScanningConfigurationArgs{
			ScanOnPush: pulumi.Bool(true),
		},
		ImageTagMutability: pulumi.String("IMMUTABLE"),
		Name:               pulumi.String(reposName),
		Tags: pulumi.StringMap{
			"Project": pulumi.String(e.Plm.Cfg.CnisProjectName),
		},
	})
	if err != nil {
		return
	}

	return
}
