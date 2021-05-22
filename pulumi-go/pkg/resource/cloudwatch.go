package resource

import (
	"pulumi-go/pkg/types"

	"github.com/pulumi/pulumi-aws/sdk/v4/go/aws/cloudwatch"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

// CloudWatchForApp holds attributes to creating CloudWatch for Apps.
type CloudWatchForApp struct {
	Plm      types.Pulumi
	LogGroup *cloudwatch.LogGroup
}

// CreateLogGroup create CloudWatch Log Group for ECS application.
func (c *CloudWatchForApp) CreateLogGroup(appId string) (err error) {
	groupName := c.Plm.Cfg.CnisResourcePrefix + "-logs-" + appId
	c.LogGroup, err = cloudwatch.NewLogGroup(c.Plm.Ctx, groupName, &cloudwatch.LogGroupArgs{
		Name:            pulumi.String("/aws/ecs/" + groupName),
		RetentionInDays: pulumi.Int(7),
		Tags: pulumi.StringMap{
			"Project": pulumi.String(c.Plm.Cfg.CnisProjectName),
		},
	})
	if err != nil {
		return
	}

	return
}
