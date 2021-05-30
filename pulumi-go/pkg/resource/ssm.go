package resource

import (
	"pulumi-go/pkg/types"

	"github.com/pulumi/pulumi-aws/sdk/v4/go/aws/ssm"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

// SsmForApp holds attributes to create Systems Manager for Apps.
type SsmForApp struct {
	Plm       types.Pulumi
	Parameter *ssm.Parameter
}

// CreateParameter creates Parameters for Apps.
func (s *SsmForApp) CreateParameter(appId string) (err error) {
	paramName := s.Plm.Cfg.CnisResourcePrefix + "-ssm-param-cnis-" + appId
	s.Parameter, err = ssm.NewParameter(s.Plm.Ctx, paramName, &ssm.ParameterArgs{
		Type:  pulumi.String("String"),
		Value: pulumi.String("Cloud Native IaC Story"),
		Name:  pulumi.String(paramName),
		Tags:  s.Plm.GetTag(),
	})
	if err != nil {
		return
	}

	return
}
