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

variable "aws_vpce_list" {
  default = {
    "ecr-api" : "ecr.api"
    "ecr-dkr" : "ecr.dkr"
    "logs" : "logs"
  }
}

variable "cnis_resource_prefix" {
  type = string
}

variable "cnis_project_name" {
  type = string
}
