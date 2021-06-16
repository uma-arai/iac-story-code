locals {
  logs_prefix = "${var.cnis_resource_prefix}-logs"
}

resource "aws_cloudwatch_log_group" "app" {
  name              = "${local.logs_prefix}-app"
  retention_in_days = 7
  tags = {
    "Project" : var.cnis_project_name
  }
}