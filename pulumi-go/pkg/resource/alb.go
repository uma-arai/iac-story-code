package resource

import (
	"pulumi-go/pkg/types"

	"github.com/pulumi/pulumi-aws/sdk/v4/go/aws/alb"
	"github.com/pulumi/pulumi-aws/sdk/v4/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v4/go/aws/lb"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

// AlbCommon holds attributes to create Application Load Balancer.
type AlbCommon struct {
	Plm           types.Pulumi
	Vpc           *ec2.Vpc
	SecurityGroup *ec2.SecurityGroup
	Subnets       map[string]*SubnetInfo
	Alb           *alb.LoadBalancer
	Listener      *lb.Listener
	TargetGroup   *alb.TargetGroup
}

// AlbForApp holds attributes of Application Load Balancer for Apps.
type AlbForApp struct {
	*AlbCommon
}

// NewAlb returns struct for ALB settings.
func NewAlb(plm types.Pulumi, vpc *ec2.Vpc, sg *ec2.SecurityGroup, subnets map[string]*SubnetInfo) *AlbCommon {
	albCommon := &AlbCommon{
		Plm:           plm,
		Vpc:           vpc,
		SecurityGroup: sg,
		Subnets:       subnets,
	}
	return albCommon
}

// CreateAlb creates ALB including listener and target group.
func (a *AlbForApp) CreateAlb(appId string) (err error) {
	if err = a.createAlb(appId); err != nil {
		return
	}
	if err = a.createTargetGroup(appId); err != nil {
		return
	}
	if err = a.createListener(appId); err != nil {
		return
	}

	return
}

// createAlb is private common function to create Alb resource.
func (a *AlbCommon) createAlb(appId string) (err error) {
	albName := a.Plm.Cfg.CnisResourcePrefix + "-alb-" + appId
	a.Alb, err = alb.NewLoadBalancer(a.Plm.Ctx, albName, &alb.LoadBalancerArgs{
		DropInvalidHeaderFields:  pulumi.Bool(true),
		EnableDeletionProtection: pulumi.Bool(false),
		IdleTimeout:              pulumi.Int(60),
		Internal:                 pulumi.Bool(false),
		IpAddressType:            pulumi.String("ipv4"),
		LoadBalancerType:         pulumi.String("application"),
		Name:                     pulumi.String(albName),
		SecurityGroups: pulumi.StringArray{
			a.SecurityGroup.ID(),
		},
		Subnets: pulumi.StringArray{
			a.Subnets["a"].subnet.ID(),
			a.Subnets["c"].subnet.ID(),
		},
		Tags: a.Plm.GetTagWithName(albName),
	}, pulumi.Parent(a.Vpc), pulumi.DeleteBeforeReplace(true))
	if err != nil {
		return
	}

	return
}

// createTargetGroup is private common function to create Target Group resource.
func (a *AlbCommon) createTargetGroup(appId string) (err error) {
	tgName := a.Plm.Cfg.CnisResourcePrefix + "-alb-tg-" + appId
	a.TargetGroup, err = alb.NewTargetGroup(a.Plm.Ctx, tgName, &alb.TargetGroupArgs{
		DeregistrationDelay: pulumi.Int(60),
		HealthCheck: alb.TargetGroupHealthCheckArgs{
			Enabled:            pulumi.Bool(true),
			HealthyThreshold:   pulumi.Int(3),
			Interval:           pulumi.Int(10),
			Matcher:            pulumi.String("200"),
			Path:               pulumi.String("/healthcheck"),
			Port:               pulumi.String("80"),
			Protocol:           pulumi.String("HTTP"),
			Timeout:            pulumi.Int(5),
			UnhealthyThreshold: pulumi.Int(2),
		},
		LoadBalancingAlgorithmType: pulumi.String("round_robin"),
		Name:                       pulumi.String(tgName),
		Port:                       pulumi.Int(80),
		Protocol:                   pulumi.String("HTTP"),
		Tags:                       a.Plm.GetTagWithName(tgName),
		TargetType:                 pulumi.String("ip"),
		VpcId:                      a.Vpc.ID(),
	}, pulumi.Parent(a.Vpc), pulumi.DeleteBeforeReplace(true))
	if err != nil {
		return
	}

	return
}

// createListener is private common function to create Listener resource.
func (a *AlbCommon) createListener(appId string) (err error) {
	lsnrName := a.Plm.Cfg.CnisResourcePrefix + "-alb-lsnr-" + appId
	a.Listener, err = lb.NewListener(a.Plm.Ctx, lsnrName, &lb.ListenerArgs{
		DefaultActions: lb.ListenerDefaultActionArray{
			&lb.ListenerDefaultActionArgs{
				Type:           pulumi.String("forward"),
				TargetGroupArn: a.TargetGroup.Arn,
			},
		},
		LoadBalancerArn: a.Alb.Arn,
		Port:            pulumi.Int(80),
		Protocol:        pulumi.String("HTTP"),
	}, pulumi.Parent(a.Alb), pulumi.DeleteBeforeReplace(true))
	if err != nil {
		return
	}

	return
}
