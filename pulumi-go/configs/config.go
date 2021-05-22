package configs

import (
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi/config"
)

// Config holds attributes read from Pulumi config YAML.
type Config struct {
	AwsRegion          string
	CnisResourcePrefix string
	CnisProjectName    string
}

// NewConfig returns Config object with config initialization.
func NewConfig(ctx *pulumi.Context) Config {
	aws := config.New(ctx, "aws")
	cnis := config.New(ctx, "cnis")

	return Config{
		AwsRegion:          aws.Require("region"),
		CnisProjectName:    cnis.Require("project_name"),
		CnisResourcePrefix: cnis.Require("resource_prefix"),
	}
}
