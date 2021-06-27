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

output "security_group_public_ingress" {
  value = aws_security_group.public_ingress
}

output "security_group_private_app" {
  value = aws_security_group.private_app
}

output "aws_iam_ecs_task_execution_role" {
  value = aws_iam_role.ecs_task_execution
}

output "aws_ecs_cluster_app" {
  value = aws_ecs_cluster.app
}

output "aws_ssm_parameter_cnis_app" {
  value = aws_ssm_parameter.cnis_app
}
