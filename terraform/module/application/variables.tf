variable "aws_region" {
  type = string
}

variable "aws_security_group_public_ingress" {}
variable "aws_subnet_public_ingress" {}
variable "aws_vpc_main" {}

variable "cnis_resource_prefix" {
  type = string
}

variable "cnis_project_name" {
  type = string
}
