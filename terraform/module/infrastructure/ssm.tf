locals {
  ssm_param_prefix = "${var.cnis_resource_prefix}-ssm-param"
}

resource "aws_ssm_parameter" "cnis_app" {
  name  = "${local.ssm_param_prefix}-cnis-app"
  type  = "String"
  value = "Cloud Native IaC Story"
  tags = {
    "Project" : var.cnis_project_name
  }
}
