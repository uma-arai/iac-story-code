# Terraformサンプルコード

## Overview
ここではTerraformのサンプルコードを提供します。
以下README.mdの内容に従って、pulumiを実行することができます。

## 前提事項
- リポジトリ直下のREADME.mdによる環境準備が完了していること。

## セットアップ

Terraformを実行するための事前設定を行います。

### tfstate保存用S3バケットの作成

まずはTerraformステートファイルを保持するためのS3バケットを作成します。

1. AWSマネジメントコンソール上部の [サービス] タブより [S3] を選択。
2. S3ダッシュボードの左側ナビゲーションメニューから [バケット] を選択し、[バケットを作成] ボタンを押下。
3. 次のように各項目を入力後、 [バケットを作成] ボタンを押下。

|項目名|値|
|-|-|
|バケット名|cnis-terraform-[AWSアカウントID]|
|AWSリージョン|アジアパフィフィック(東京)|
|このバケットのブロックパブリックアクセス設定|パブリックアクセスをすべてブロック|
|バケットのバージョニング|無効にする|
|デフォルトの暗号化|有効にする|
|暗号キータイプ|Amazon S3キー(SSE-S3)|

4. S3ダッシュボード上にてS3バケットが作成できていることを確認。

### 排他制御用のDynamoDBの作成

次にTerraformロックファイル管理用のDynamoDBテーブルを作成します。

1. AWSマネジメントコンソール上部の [サービス] タブより [DynamoDB] を選択。
2. DynamoDB ダッシュボードの左側ナビゲーションメニューから [テーブル] を選択し、[テーブルの作成] ボタンを押下。
3. [DynamoDBテーブルの作成] では、次のように各項目を入力後、 [作成] ボタンを押下。

|項目名|値|
|-|-|
|テーブル名|cnis-terraform-state-lock|
|プライマリーキー|LockID(文字列)|
|ソートキーの追加|チェックしない|
|テーブル設定 - デフォルト設定の使用|チェックを外す|
|読み込み/書き込みキャパシティーモード|オンデマンド|
|保管時の暗号化|デフォルト|

4. DynamoDBコンソール上にてテーブルが作成できていることを確認。

ここで、DynamoDBのプライマリーキーは必ず「LockID」としてください。


### tfenvのインストール

tfenvはTerraformのバージョン管理や切り替えが簡単に行えるオープンソースです。
今回、Terraformのインストールはtfenvで実施することで容易にバージョン管理可能な構成方針とします。

1. Cloud9 IDEを開き、画面下部のコマンドラインにて以下を入力。

```bash
# インストール対象のディレクトリを作成
$ cd ~/environment
$ mkdir .tfenv

# Githubリポジトリからtfenvをダウンロードし、所定の場所にインストール
$ wget https://github.com/tfutils/tfenv/archive/v2.2.2.tar.gz

$ tar zxvf ./v2.2.2.tar.gz
$ mv tfenv-2.2.2/* .tfenv/

# tfenv実行に必要なパスを通す
$ echo 'export PATH="$HOME/environment/.tfenv/bin:$PATH"' >> ~/.bash_profile
$ source ~/.bash_profile

# バージョンの確認 (下記出力内容は2020年7月5時点の内容)
$ tfenv 
tfenv 2.2.2
Usage: tfenv <command> [<options>]

Commands:
   install       Install a specific version of Terraform
   use           Switch a version to use
   uninstall     Uninstall a specific version of Terraform
   list          List all installed versions
   list-remote   List all installable versions
   version-name  Print current version
   init          Update environment to use tfenv correctly.

# 不要なファイルを削除
$ rm -rf tfenv-2.2.2*
$ rm v2.2.2.tar.gz
```

### Terraformのインストール

次にtfenv経由でTerraformをインストールします。

```bash
$ tfenv install 1.0.0
Installing Terraform v1.0.0
Downloading release tarball from https://releases.hashicorp.com/terraform/1.0.0/terraform_1.0.0_linux_amd64.zip
################################################################################################################################################################################################################################################# 100.0%
Downloading SHA hash file from https://releases.hashicorp.com/terraform/1.0.0/terraform_1.0.0_SHA256SUMS
No keybase install found, skipping OpenPGP signature verification
terraform_1.0.0_linux_amd64.zip: OK
Archive:  tfenv_download.0N7X1a/terraform_1.0.0_linux_amd64.zip
  inflating: /home/ec2-user/environment/.tfenv/versions/1.0.0/terraform  
Installation of terraform v1.0.0 successful. To make this your default version, run 'tfenv use 1.0.0'

$ tfenv use 1.0.0
Switching default version to v1.0.0
Switching completed

$ tfenv list
* 1.0.0 (set by /home/ec2-user/environment/.tfenv/version)

# terraformコマンドの実行確認
$ terraform -v
Terraform v1.0.0
on linux_amd64

```

### Terragruntのインストール

今回はTerraformのラッパーツールであるTerragruntを利用します。
Terragruntを利用することで、コードの重複を減らす(DRY; Don't Repeat Yourself)ことができ、コードの管理がよりシンプルになります。
ここでは、Terragruntのインストール手順を実施していきます。

```bash
# Terragruntのダウンロード
$ cd ~/environment
$ wget https://github.com/gruntwork-io/terragrunt/releases/download/v0.30.3/terragrunt_linux_amd64

# ダウンロードしたバイナリファイルの配置
$ mv terragrunt_linux_amd64 terragrunt
$ chmod 755 terragrunt
$ sudo mv terragrunt /usr/local/bin/

# terragruntコマンドの実行確認
$ terragrunt -v
terragrunt version v0.30.3
```

以上でTerraform実行に必要な準備がすべて整いました。

## Terraformの実行

いよいよサンプルソースコードを利用してAWSリソースを作成します。
`init` -> `plan` -> `apply`の順番に実行していきます。
Terragruntによりラップされた状態でコールしていきます。

```
# AWS Providerプラグイン等のインストールするためにinitを実行
$ terragrunt init
Initializing modules...

Initializing the backend...

Successfully configured the backend "s3"! Terraform will automatically
use this backend unless the backend configuration changes.

Initializing provider plugins...
- Finding hashicorp/aws versions matching "~> 3.45.0"...
- Finding latest version of hashicorp/template...
- Installing hashicorp/aws v3.45.0...
- Installed hashicorp/aws v3.45.0 (signed by HashiCorp)
- Installing hashicorp/template v2.2.0...
- Installed hashicorp/template v2.2.0 (signed by HashiCorp)

Terraform has created a lock file .terraform.lock.hcl to record the provider
selections it made above. Include this file in your version control repository
so that Terraform can guarantee to make the same selections by default when
you run "terraform init" in the future.

Terraform has been successfully initialized!

You may now begin working with Terraform. Try running "terraform plan" to see
any changes that are required for your infrastructure. All Terraform commands
should now work.

If you ever set or change modules or backend configuration for Terraform,
rerun this command to reinitialize your working directory. If you forget, other
commands will detect it and remind you to do so if necessary.


# Planによる作成予定リソースの確認
$ terragrunt plan
Terraform used the selected providers to generate the following execution
plan. Resource actions are indicated with the following symbols:
  + create
 <= read (data resources)

Terraform will perform the following actions:

  # module.application.data.template_file.aws_ecs_task_definition will be read during apply
  # (config refers to values not yet known)
 <= data "template_file" "aws_ecs_task_definition"  {
      + id       = (known after apply)
      + rendered = (known after apply)
      + template = jsonencode(
		  :

      + vpc_endpoint_type     = "Interface"
      + vpc_id                = (known after apply)
    }

Plan: 34 to add, 0 to change, 0 to destroy.

─────────────────────────────────────────────────────────────────────────────

Note: You didn't use the -out option to save this plan, so Terraform can't
guarantee to take exactly these actions if you run "terraform apply" now.


# Applyによるリソース作成
$ terragrunt apply
:
Plan: 34 to add, 0 to change, 0 to destroy.

Do you want to perform these actions?
  Terraform will perform the actions described above.
  Only 'yes' will be accepted to approve.

  Enter a value: yes 			# yesと入力する

module.infrastructure.aws_ecs_cluster.app: Creating...
module.application.aws_cloudwatch_log_group.app: Creating...
module.infrastructure.aws_iam_role.ecs_task_execution: Creating...
:

Apply complete! Resources: 3 added, 0 changed, 0 destroyed.
```

## アプリの疎通確認
// TODO
## 後片付け

### AWSリソースの削除

### 排他制御用のDynamoDBの削除

### tfstate保存用S3バケット削除

## 補足
- ニーズがあれば、ハンズオン資料を充実させたいと思うので、必要であればプルリク上げてください。

#### 参考

