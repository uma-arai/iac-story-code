terraform {
  required_version = "v1.0.0"

  backend "s3" {}

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.45.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

module "infrastructure" {
  source = "../../module/infrastructure"

  aws_region                     = var.aws_region
  aws_subnet_cidr_public_ingress = var.aws_subnet_cidr_public_ingress
  aws_subnet_cidr_private_app    = var.aws_subnet_cidr_private_app
  aws_subnet_cidr_private_egress = var.aws_subnet_cidr_private_egress

  cnis_project_name    = var.cnis_project_name
  cnis_resource_prefix = var.cnis_resource_prefix
}

module "application" {
  source = "../../module/application"

  aws_ecs_cluster_app               = module.infrastructure.aws_ecs_cluster_app
  aws_iam_ecs_task_execution_role   = module.infrastructure.aws_iam_ecs_task_execution_role
  aws_region                        = var.aws_region
  aws_security_group_public_ingress = module.infrastructure.security_group_public_ingress
  aws_security_group_private_app    = module.infrastructure.security_group_private_app
  aws_ssm_param_cnis_app            = module.infrastructure.aws_ssm_parameter_cnis_app
  aws_subnet_private_app            = module.infrastructure.aws_subnet_private_app
  aws_subnet_public_ingress         = module.infrastructure.aws_subnet_public_ingress
  aws_vpc_main                      = module.infrastructure.aws_vpc_main

  cnis_project_name    = var.cnis_project_name
  cnis_resource_prefix = var.cnis_resource_prefix
}