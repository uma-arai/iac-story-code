locals {
  vpc_prefix    = "${var.cnis_resource_prefix}-vpc"
  igw_prefix    = "${var.cnis_resource_prefix}-igw"
  subnet_prefix = "${var.cnis_resource_prefix}-subnet"
  rt_prefix     = "${var.cnis_resource_prefix}-rt"
  vpce_prefix   = "${var.cnis_resource_prefix}-vpce"

  subnet_egress_list = [
    for az_id in keys(var.aws_subnet_cidr_private_egress) :
    aws_subnet.private_egress[az_id].id
  ]
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

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  tags = {
    "Name"    = "${local.rt_prefix}-public"
    "Project" = var.cnis_project_name
  }
}

resource "aws_route_table_association" "public" {
  for_each = var.aws_subnet_cidr_public_ingress

  route_table_id = aws_route_table.public.id
  subnet_id      = aws_subnet.public_ingress[each.key].id
}

resource "aws_route_table" "internal" {
  vpc_id = aws_vpc.main.id
  tags = {
    "Name"    = "${local.rt_prefix}-internal"
    "Project" = var.cnis_project_name
  }
}

resource "aws_route_table_association" "internal_vpce_s3" {
  for_each = var.aws_subnet_cidr_private_app

  route_table_id = aws_route_table.internal.id
  subnet_id      = aws_subnet.private_app[each.key].id
}

resource "aws_vpc_endpoint" "s3" {
  route_table_ids = [
    aws_route_table.internal.id
  ]
  service_name = "com.amazonaws.${var.aws_region}.s3"
  tags = {
    "Name"    = "${local.vpce_prefix}-s3"
    "Project" = var.cnis_project_name
  }
  vpc_endpoint_type = "Gateway"
  vpc_id            = aws_vpc.main.id
}

resource "aws_vpc_endpoint" "vpce" {
  for_each = var.aws_vpce_list

  service_name        = "com.amazonaws.${var.aws_region}.${each.value}"
  vpc_id              = aws_vpc.main.id
  private_dns_enabled = true
  security_group_ids = [
    aws_security_group.private_egress.id
  ]
  subnet_ids = local.subnet_egress_list
  tags = {
    "Name"    = "${local.vpce_prefix}-${each.key}"
    "Project" = var.cnis_project_name
  }
  vpc_endpoint_type = "Interface"
}

output "aws_vpc_main" {
  value = aws_vpc.main
}

output "aws_subnet_public_ingress" {
  value = {
    for subnet in aws_subnet.public_ingress :
    subnet.availability_zone => subnet.id
  }
}

output "aws_subnet_private_app" {
  value = {
    for subnet in aws_subnet.private_app :
    subnet.availability_zone => subnet.id
  }
}