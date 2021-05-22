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
