locals {
  ecr_prefix = "${var.cnis_resource_prefix}-ecr"
}

resource "aws_ecr_repository" "app" {
  image_scanning_configuration {
    scan_on_push = true
  }
  image_tag_mutability = "IMMUTABLE"
  name                 = "${local.ecr_prefix}-app"
  tags = {
    "Project" : var.cnis_project_name
  }
}