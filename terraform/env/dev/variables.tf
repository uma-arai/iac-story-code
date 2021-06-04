variable "aws_account_id" {}

variable "aws_region" {
  type = string
}

variable "aws_subnet_cidr_public_ingress" {
  type = map(string)
}

variable "aws_subnet_cidr_private_app" {
  type = map(string)
}

variable "aws_subnet_cidr_private_egress" {
  type = map(string)
}

variable "cnis_project_name" {
  type = string
}

variable "cnis_resource_prefix" {
  type = string
}