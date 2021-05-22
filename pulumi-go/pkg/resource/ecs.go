package resource

import (
	"pulumi-go/pkg/types"

	"github.com/pulumi/pulumi-aws/sdk/v4/go/aws/ecs"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

// Ecs holds attribute for create ECS resources.
type Ecs struct {
	Plm     types.Pulumi
	Cluster map[string]*ecs.Cluster
}

// CreateEcsCluster creates ECS Cluster.
func (e *Ecs) CreateEcsCluster(clusterId string) (err error) {
	clusterName := e.Plm.Cfg.CnisResourcePrefix + "-ecs-cluster-" + clusterId
	e.Cluster[clusterId], err = ecs.NewCluster(e.Plm.Ctx, clusterName, &ecs.ClusterArgs{
		Name: pulumi.String(clusterName),
		Settings: &ecs.ClusterSettingArray{
			&ecs.ClusterSettingArgs{
				Name:  pulumi.String("containerInsights"),
				Value: pulumi.String("enabled"),
			},
		},
	})
	if err != nil {
		return
	}

	return
}
