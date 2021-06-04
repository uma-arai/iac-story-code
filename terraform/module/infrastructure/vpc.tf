locals {
  vpc_prefix = "${var.cnis_resource_prefix}-vpc"
  igw_prefix = "${var.cnis_resource_prefix}-igw"
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

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags = {
    "Name"    = "${local.igw_prefix}-main"
    "Project" = var.cnis_project_name
  }
}
