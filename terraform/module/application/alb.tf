locals {
  alb_prefix = "${var.cnis_resource_prefix}-alb"
}

resource "aws_alb" "app" {
  drop_invalid_header_fields = true
  enable_deletion_protection = false
  idle_timeout               = 60
  internal                   = false
  ip_address_type            = "ipv4"
  load_balancer_type         = "application"
  name                       = "${local.alb_prefix}-app"
  security_groups = [
    var.aws_security_group_public_ingress.id
  ]
  subnets = [
    for subnet_id in var.aws_subnet_public_ingress :
    subnet_id
  ]
  tags = {
    "Name"    = "${local.alb_prefix}-app"
    "Project" = var.cnis_project_name
  }
}

resource "aws_alb_target_group" "app" {
  deregistration_delay = 60
  health_check {
    enabled             = true
    healthy_threshold   = 3
    interval            = 10
    matcher             = "200"
    path                = "/healthcheck"
    port                = "80"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }
  load_balancing_algorithm_type = "round_robin"
  name                          = "${local.alb_prefix}-tg-app"
  port                          = 80
  protocol                      = "HTTP"
  tags = {
    "Name"    = "${local.alb_prefix}-tg-app"
    "Project" = var.cnis_project_name
  }
  target_type = "ip"
  vpc_id      = var.aws_vpc_main.id
}

resource "aws_alb_listener" "app" {
  load_balancer_arn = aws_alb.app.arn
  port              = 80
  default_action {
    type             = "forward"
    target_group_arn = aws_alb_target_group.app.arn
  }
  protocol = "HTTP"
}