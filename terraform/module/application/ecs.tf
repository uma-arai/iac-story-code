locals {
  ecs_prefix = "${var.cnis_resource_prefix}-ecs"
}

resource "aws_ecs_task_definition" "app" {
  container_definitions    = data.template_file.aws_ecs_task_definition.rendered
  cpu                      = "256"
  execution_role_arn       = var.aws_iam_ecs_task_execution_role.arn
  family                   = "${local.ecs_prefix}-taskdef-app"
  memory                   = "512"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  tags = {
    "Project" = var.cnis_project_name
  }
}

resource "aws_ecs_service" "app" {
  cluster                            = var.aws_ecs_cluster_app.arn
  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100
  deployment_controller {
    type = "ECS"
  }
  desired_count                     = 1
  enable_ecs_managed_tags           = true
  health_check_grace_period_seconds = 60
  launch_type                       = "FARGATE"
  load_balancer {
    container_name   = "${local.ecs_prefix}-container-app"
    container_port   = 80
    target_group_arn = aws_alb_target_group.app.arn
  }
  name = "${local.ecs_prefix}-service-app"
  network_configuration {
    subnets          = values(var.aws_subnet_private_app)
    assign_public_ip = false
    security_groups  = [var.aws_security_group_private_app.id]
  }
  platform_version = "1.4.0"
  task_definition  = aws_ecs_task_definition.app.arn
  tags = {
    "Project" = var.cnis_project_name
  }
}

data "template_file" "aws_ecs_task_definition" {
  template = file("../../module/application/taskdef/taskdef-app.json")

  vars = {
    aws_ecs_task_name = "${local.ecs_prefix}-container-app"
    aws_ecr_repos_url = aws_ecr_repository.app.repository_url
    aws_log_group     = aws_cloudwatch_log_group.app.id
    aws_region        = var.aws_region
    aws_ssm_parameter = var.aws_ssm_param_cnis_app.arn
  }
}