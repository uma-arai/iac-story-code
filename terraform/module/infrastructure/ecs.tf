locals {
  ecs_prefix = "${var.cnis_resource_prefix}-ecs"
}

resource "aws_ecs_cluster" "app" {
  name = "${local.ecs_prefix}-cluster-app"
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  tags = {
    "Project" = var.cnis_project_name
  }
}
