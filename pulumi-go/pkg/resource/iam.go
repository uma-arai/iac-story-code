package resource

import (
	"io/ioutil"
	"pulumi-go/pkg/types"

	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"

	"github.com/pulumi/pulumi-aws/sdk/v4/go/aws/iam"
)

const (
	iamJsonPath = "pkg/resource/policy/"
)

// IamForEcs holds attributes to set up IAM configuration for ECS.
type IamForEcs struct {
	Plm  types.Pulumi
	Role *iam.Role
}

// CreateRole creates ECS execution role and related policy.
func (i *IamForEcs) CreateRole() (err error) {
	roleId := "ecs-task-execution"
	iamPrefix := i.Plm.Cfg.CnisResourcePrefix + "-" + roleId
	roleJson, err := ioutil.ReadFile(iamJsonPath + "iam-" + roleId + "-role.json")
	if err != nil {
		return
	}

	i.Role, err = iam.NewRole(i.Plm.Ctx, iamPrefix+"-role", &iam.RoleArgs{
		AssumeRolePolicy: pulumi.String(roleJson),
		Name:             pulumi.String("CnisECSTaskExecutionRole"),
		Tags:             i.Plm.GetTag(),
	})
	if err != nil {
		return
	}

	_, err = iam.NewRolePolicyAttachment(i.Plm.Ctx, iamPrefix+"-managed-policy-attachment", &iam.RolePolicyAttachmentArgs{
		PolicyArn: pulumi.String("arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"),
		Role:      i.Role.Name,
	})
	if err != nil {
		return
	}

	return
}
