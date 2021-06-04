# ---------------------------------
#  Scope: global
# ---------------------------------
aws_region = "ap-northeast-1"

aws_subnet_cidr_public_ingress = {
  "a" = "10.0.0.0/24"
  "c" = "10.0.1.0/24"
}

aws_subnet_cidr_private_app = {
  "a" = "10.0.8.0/24"
  "c" = "10.0.9.0/24"
}

aws_subnet_cidr_private_egress = {
  "a" = "10.0.240.0/24"
  "c" = "10.0.241.0/24"
}

cnis_project_name    = "CloudNativeIaCStory"
cnis_resource_prefix = "cnis"