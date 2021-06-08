locals {
  iam_prefix = "${var.cnis_resource_prefix}-iam"
}

resource "aws_iam_role" "ecs_task_execution" {
  assume_role_policy = data.aws_iam_policy_document.ecs_task_execution_role.json
  name               = "CnisECSTaskExecutionRole"
  tags = {
    "Project" = var.cnis_project_name
  }
}

resource "aws_iam_role_policy" "ecs_task_execution" {
  name   = "CnisECSTaskExecutionPolicy"
  policy = data.aws_iam_policy_document.ecs_task_execution_policy.json
  role   = aws_iam_role.ecs_task_execution.id
}

resource "aws_iam_role_policy_attachment" "es_task_execution" {
  role       = aws_iam_role.ecs_task_execution.id
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

data "aws_iam_policy_document" "ecs_task_execution_role" {
  version = "2012-10-17"
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      identifiers = ["ecs-tasks.amazonaws.com"]
      type        = "Service"
    }
  }
}

data "aws_iam_policy_document" "ecs_task_execution_policy" {
  version = "2012-10-17"
  statement {
    effect    = "Allow"
    actions   = ["ssm:GetParameters"]
    resources = ["*"]
  }
}
