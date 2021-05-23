package types

import (
	"pulumi-go/configs"

	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

// Pulumi holds common attributes between all resources.
type Pulumi struct {
	Ctx *pulumi.Context
	Cfg *configs.Config
}

// GetTagWithName returns AWS tag information.
func (p *Pulumi) GetTagWithName(name string) pulumi.StringMap {
	return pulumi.StringMap{
		"Name":    pulumi.String(name),
		"Project": pulumi.String(p.Cfg.CnisProjectName),
	}
}
