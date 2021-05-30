package configs

import (
	"os"

	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi/config"
)

// Config holds attributes read from Pulumi config YAML.
type Config struct {
	AwsAccountId       string
	AwsRegion          string
	CnisResourcePrefix string
	CnisProjectName    string
}

// NewConfig returns Config object with config initialization.
func NewConfig(ctx *pulumi.Context) Config {
	aws := config.New(ctx, "aws")
	cnis := config.New(ctx, "cnis")
	c := Config{
		AwsRegion:          aws.Require("region"),
		CnisProjectName:    cnis.Require("project_name"),
		CnisResourcePrefix: cnis.Require("resource_prefix"),
	}
	c.loadConfig()

	return c
}

// loadConfig loads configuration from OS environmental variables.
func (c *Config) loadConfig() {
	c.AwsAccountId = os.Getenv("AWS_ACCOUNT_ID")
}
