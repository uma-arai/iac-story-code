remote_state {
  backend = "s3"
  config = {
    bucket         = "cnis-terraform-${get_aws_account_id()}"
    key            = "${path_relative_to_include()}/terraform.tfstate"
    region         = "ap-northeast-1"
    encrypt        = true
    dynamodb_table = "cnis-terraform-state-lock"
  }
}

terraform {
  extra_arguments "vars" {
    commands = get_terraform_commands_that_need_vars()

    required_var_files = [
      "${get_terragrunt_dir()}/terraform.tfvars",
      "${get_parent_terragrunt_dir()}/terraform.tfvars",
    ]
  }
}

inputs = {
  aws_account_id = get_aws_account_id()
}