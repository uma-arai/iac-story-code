locals {
  vpc_prefix    = "${var.cnis_resource_prefix}-vpc"
  igw_prefix    = "${var.cnis_resource_prefix}-igw"
  subnet_prefix = "${var.cnis_resource_prefix}-subnet"
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

resource "aws_subnet" "public_ingress" {
  for_each = var.aws_subnet_cidr_public_ingress

  cidr_block        = each.value
  vpc_id            = aws_vpc.main.id
  availability_zone = "${var.aws_region}${each.key}"

  tags = {
    "Name"    = "${local.subnet_prefix}-subnet-public-ingress-${each.key}"
    "Project" = var.cnis_project_name
  }
}

resource "aws_subnet" "private_app" {
  for_each = var.aws_subnet_cidr_private_app

  cidr_block        = each.value
  vpc_id            = aws_vpc.main.id
  availability_zone = "${var.aws_region}${each.key}"

  tags = {
    "Name"    = "${local.subnet_prefix}-subnet-private-app-${each.key}"
    "Project" = var.cnis_project_name
  }
}

resource "aws_subnet" "private_egress" {
  for_each = var.aws_subnet_cidr_private_egress

  cidr_block        = each.value
  vpc_id            = aws_vpc.main.id
  availability_zone = "${var.aws_region}${each.key}"

  tags = {
    "Name"    = "${local.subnet_prefix}-subnet-private-egress-${each.key}"
    "Project" = var.cnis_project_name
  }
}

