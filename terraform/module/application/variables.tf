variable "aws_region" {
  type = string
}
variable "aws_ecs_cluster_app" {}
variable "aws_iam_ecs_task_execution_role" {}
variable "aws_security_group_public_ingress" {}
variable "aws_security_group_private_app" {}
variable "aws_ssm_param_cnis_app" {}
variable "aws_subnet_private_app" {}
variable "aws_subnet_public_ingress" {}
variable "aws_vpc_main" {}

variable "cnis_resource_prefix" {
  type = string
}

variable "cnis_project_name" {
  type = string
}
