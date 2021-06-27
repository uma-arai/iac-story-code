package resource

import (
	"fmt"
	"io/ioutil"
	"pulumi-go/pkg/types"
	"strings"

	"github.com/pulumi/pulumi-aws/sdk/v4/go/aws/ssm"

	"github.com/pulumi/pulumi-aws/sdk/v4/go/aws/alb"
	"github.com/pulumi/pulumi-aws/sdk/v4/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v4/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v4/go/aws/ecr"
	"github.com/pulumi/pulumi-aws/sdk/v4/go/aws/ecs"
	"github.com/pulumi/pulumi-aws/sdk/v4/go/aws/iam"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

// Ecs holds attribute for create ECS resources.
type Ecs struct {
	Plm           types.Pulumi
	Cluster       map[string]*ecs.Cluster
	LogGroup      *cloudwatch.LogGroup
	Ecr           *ecr.Repository
	Parameter     *ssm.Parameter
	SecurityGroup *ec2.SecurityGroup
	Service       map[string]*ecs.Service
	Subnets       map[string]*SubnetInfo
	TargetGroup   *alb.TargetGroup
	TaskDef       map[string]*ecs.TaskDefinition
	TaskExecRole  *iam.Role
}

// CreateCluster creates ECS cluster.
func (e *Ecs) CreateCluster(clusterId string) (err error) {
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

// CreateTaskDefinition create ECS task definition.
func (e *Ecs) CreateTaskDefinition(appId string) (err error) {
	taskDef, err := e.geTaskDef(appId)
	if err != nil {
		return
	}

	defName := e.Plm.Cfg.CnisResourcePrefix + "-ecs-taskdef-" + appId
	e.TaskDef[appId], err = ecs.NewTaskDefinition(e.Plm.Ctx, defName, &ecs.TaskDefinitionArgs{
		ContainerDefinitions: taskDef,
		Cpu:                  pulumi.String("256"),
		ExecutionRoleArn:     e.TaskExecRole.Arn,
		Family:               pulumi.String(defName),
		Memory:               pulumi.String("512"),
		NetworkMode:          pulumi.String("awsvpc"),
		RequiresCompatibilities: pulumi.StringArray{
			pulumi.String("FARGATE"),
		},
		Tags: e.Plm.GetTag(),
	})
	if err != nil {
		return
	}

	return
}

// CreateService create ECS service.
func (e *Ecs) CreateService(appId string) (err error) {
	serviceName := e.Plm.Cfg.CnisResourcePrefix + "-ecs-service-" + appId
	e.Service[appId], err = ecs.NewService(e.Plm.Ctx, serviceName, &ecs.ServiceArgs{
		Cluster:                         e.Cluster[appId].Arn,
		DeploymentMaximumPercent:        pulumi.Int(200),
		DeploymentMinimumHealthyPercent: pulumi.Int(100),
		DeploymentController: ecs.ServiceDeploymentControllerArgs{
			Type: pulumi.String("ECS"),
		},
		DesiredCount:                  pulumi.Int(1),
		EnableEcsManagedTags:          pulumi.Bool(true),
		HealthCheckGracePeriodSeconds: pulumi.Int(60),
		LaunchType:                    pulumi.String("FARGATE"),
		LoadBalancers: ecs.ServiceLoadBalancerArray{
			&ecs.ServiceLoadBalancerArgs{
				ContainerName:  pulumi.String(e.Plm.Cfg.CnisResourcePrefix + "-ecs-container-" + appId),
				ContainerPort:  pulumi.Int(80),
				TargetGroupArn: e.TargetGroup.Arn,
			},
		},
		Name: pulumi.String(serviceName),
		NetworkConfiguration: &ecs.ServiceNetworkConfigurationArgs{
			Subnets: pulumi.StringArray{
				e.Subnets["a"].subnet.ID(),
				e.Subnets["c"].subnet.ID(),
			},
			AssignPublicIp: pulumi.BoolPtr(false),
			SecurityGroups: pulumi.StringArray{
				e.SecurityGroup.ID(),
			},
		},
		PlatformVersion: pulumi.String("1.4.0"),
		TaskDefinition:  e.TaskDef[appId].Arn,
		Tags:            e.Plm.GetTag(),
	}, pulumi.Parent(e.Cluster[appId]), pulumi.IgnoreChanges([]string{"taskDefinition", "desiredCount", "networkConfiguration"}))
	if err != nil {
		return
	}

	return
}

// getTaskDef returns ECS Task Definition loaded by external JSON file.
func (e *Ecs) geTaskDef(appId string) (taskDef pulumi.StringOutput, err error) {
	const taskDefPath = "pkg/resource/taskdef/"
	taskDefJson, err := ioutil.ReadFile(taskDefPath + "taskdef-" + appId + ".json")
	if err != nil {
		return
	}

	return e.replaceTaskParameter(appId, string(taskDefJson)), nil
}

// replaceTaskParameter replace embedded Parameter to actual values.
func (e *Ecs) replaceTaskParameter(appId string, taskDef string) (taskDefPlm pulumi.StringOutput) {
	containerName := e.Plm.Cfg.CnisResourcePrefix + "-ecs-container-" + appId
	taskDef = strings.Replace(taskDef, "<CONTAINER_NAME>", containerName, -1)
	taskDef = strings.Replace(taskDef, "<AWS_ACCOUNT_ID>", e.Plm.Cfg.AwsAccountId, -1)
	taskDef = strings.Replace(taskDef, "<AWS_REGION>", e.Plm.Cfg.AwsRegion, -1)

	taskDefPlm = pulumi.All(e.Ecr.Name, e.LogGroup.Name, e.Parameter.Arn).ApplyT(func(args []interface{}) string {
		taskDef = strings.Replace(taskDef, "<ECR_REPOS_NAME>", fmt.Sprint(args[0]), -1)
		taskDef = strings.Replace(taskDef, "<LOG_GROUP>", fmt.Sprint(args[1]), -1)
		taskDef = strings.Replace(taskDef, "<SSM_PARAM_TEST_ARN>", fmt.Sprint(args[2]), -1)
		return taskDef
	}).(pulumi.StringOutput)

	return
}
