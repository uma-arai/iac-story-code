terraform {
  required_version = "v0.15.5"

  backend "s3" {}

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.44.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

module "infrastructure" {
  source = "../../module/infrastructure"

  cnis_project_name    = var.cnis_project_name
  cnis_resource_prefix = var.cnis_resource_prefix
}