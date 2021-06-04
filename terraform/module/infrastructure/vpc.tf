locals {
  vpc_prefix = "${var.cnis_resource_prefix}-vpc"
}

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = "true"
  enable_dns_support   = "true"
  tags = {
    "Name"    = "${local.vpc_prefix}-main"
    "Project" = var.cnis_project_name
  }
}
