locals {
  sg_prefix = "${var.cnis_resource_prefix}-sg"
}

resource "aws_security_group" "public_ingress" {
  name   = "${local.sg_prefix}-public-ingress"
  vpc_id = aws_vpc.main.id

  ingress {
    cidr_blocks = ["0.0.0.0/0"]
    from_port   = 80
    protocol    = "tcp"
    to_port     = 80
  }
  egress {
    cidr_blocks      = ["0.0.0.0/0"]
    from_port        = 0
    ipv6_cidr_blocks = ["::/0"]
    protocol         = "-1"
    to_port          = 0
  }
  tags = {
    "Name" : "${local.sg_prefix}-public-ingress"
    "Project" : var.cnis_project_name
  }
}

resource "aws_security_group" "private_app" {
  name   = "${local.sg_prefix}-private-app"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port = 80
    protocol  = "tcp"
    security_groups = [
      aws_security_group.public_ingress.id
    ]
    to_port = 80
  }
  egress {
    cidr_blocks      = ["0.0.0.0/0"]
    from_port        = 0
    ipv6_cidr_blocks = ["::/0"]
    protocol         = "-1"
    to_port          = 0
  }
  tags = {
    "Name" : "${local.sg_prefix}-private-app"
    "Project" : var.cnis_project_name
  }
}

resource "aws_security_group" "private_egress" {
  name   = "${local.sg_prefix}-private-egress"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port = 443
    protocol  = "tcp"
    security_groups = [
      aws_security_group.private_app.id
    ]
    to_port = 443
  }
  egress {
    cidr_blocks      = ["0.0.0.0/0"]
    from_port        = 0
    ipv6_cidr_blocks = ["::/0"]
    protocol         = "-1"
    to_port          = 0
  }
  tags = {
    "Name" : "${local.sg_prefix}-private-egress"
    "Project" : var.cnis_project_name
  }
}

output "security_group_public_ingress" {
  value = aws_security_group.public_ingress
}

output "security_group_private_app" {
  value = aws_security_group.private_app
}