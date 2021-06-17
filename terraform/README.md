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

```bash
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

## ECRへのアプリコンテナ登録

作られたAWSリソースにおいて、ECSはECRからコンテナイメージを取得してデプロイするのですが、
現状ではECRにコンテナが登録されていません。
そこで、次に従ってサンプルアプリをコンテナビルドし、ECRに対してプッシュします。

```bash

# Dockerビルドにてコンテナイメージを作成
$ cd ~/environment/iac-story-code/app/
$ export CONTAINER_NAME="cnisapp"
$ export CONTAINER_TAG="init"
$ docker build -t ${CONTAINER_NAME}:${CONTAINER_TAG} .
Sending build context to Docker daemon  11.82MB
Step 1/14 : FROM golang:1.16.5-alpine3.13 AS build-env
1.16.5-alpine3.13: Pulling from library/golang
:
Successfully built 7aa88fd39158
Successfully tagged cnisapp:v1

# ECRにログインしてコンテナイメージをプッシュ
$ export AWS_ACCOUNT_ID=`aws sts get-caller-identity | jq .Account -r`
$ $(aws ecr get-login --no-include-email --registry-ids ${AWS_ACCOUNT_ID} --region ap-northeast-1)

$ AWS_ECR_URL=`aws ecr describe-repositories | jq .repositories[].repositoryUri -r | grep cnis-ecr-app`; docker tag ${CONTAINER_NAME}:${CONTAINER_TAG} ${AWS_ECR_URL}:${CONTAINER_TAG}

$ docker push ${AWS_ECR_URL}:${CONTAINER_TAG}

# プッシュしたイメージ内容の確認
$ AWS_ECR_REPO_NAME=`aws ecr describe-repositories | jq .repositories[].repositoryName -r | grep cnis`; aws ecr describe-images --repository-name $AWS_ECR_REPO_NAME
```

以上でデプロイするコンテナイメージがECRに登録できました。

## アプリのデプロイ確認

続けて、以下コマンドによりプッシュしたコンテナがECS上にデプロイされるか確認します。
デプロイが完了すると、以下のようにECSタスクのARNが返却されます。
```bash
$ while true; do aws ecs list-tasks --cluster cnis-ecs-cluster-app; sleep 10; done
{
    "taskArns": []
}
{
    "taskArns": []
}
:
{
    "taskArns": [
        "arn:aws:ecs:ap-northeast-1:123456789012:task/cnis-ecs-cluster-app/8e2be702a59a4d5d9847b0f1cfdb52b0"
    ]
}
# Ctel+C で停止
```

## アプリの疎通確認

デプロイされたアプリに対してリクエストを送ります。
```bash
$ export APP_FQDN=`aws elbv2 describe-load-balancers | jq .LoadBalancers[].DNSName -r | grep cnis-`
$ curl http://${APP_FQDN}/cnis/v1/helloworld
"Hello world!"
```

ハローワールドのレスポンスが返ってきました！
IaCから作成されたアプリが正常稼働していそうです。
続けて、Systems Manager パラメータストアに格納された値がアプリの環境変数として取り込まれているので、
その値を取得してみましょう。

まずはパラメータストアの値を見てみます。

```bash
$ aws ssm get-parameter --name cnis-ssm-param-cnis-app | jq .Parameter.Value -r
Cloud Native IaC Story
```

"Cloud Native IaC Story"という値が設定されていますね。
続けてデプロイアプリに対してリクエストを行います。

```bash
$ curl http://${APP_FQDN}/cnis/v1/param
"Cloud Native IaC Story"
```

同じ文字列が返却されました！
IaCから作成されたECSやSSMパラメータストアを通して、アプリが稼働する一連のAWSリソースを作成できました。

以上でハンズオンは終了です。
ぜひ、こちらのIaCサンプルコードを活用して、自分達のIaCサービスに活用していってください。

## 後片付け

作成したAWSリソースを順番に削除していきます。

### AWSリソースの削除

Terraformから作成したリソースを一括で削除します。

```bash
$ cd ~/environment/iac-story-code/terraform/env/dev/
$ terragrunt destroy
:
Plan: 0 to add, 0 to change, 34 to destroy.

Do you really want to destroy all resources?
  Terraform will destroy all your managed infrastructure, as shown above.
  There is no undo. Only 'yes' will be accepted to confirm.

  Enter a value: yes 			# yesと入力する
:

Destroy complete! Resources: 34 destroyed.
```

### 排他制御用のDynamoDBの削除

排他制御用に作成したDynamoDBを削除します。

1. AWSマネジメントコンソール上部の [サービス] タブより [DynamoDB] を選択。
2. DynamoDB ダッシュボードの左側ナビゲーションメニューから [テーブル] を選択。
3. テーブル一覧画面から [cnis-terraform-state-lock] を選択し、[テーブルの削除] を押下。
4. [このテーブルに対応するすべての CloudWatch アラームを削除します]にチェックを入れ、テキストボックスに[delete]と入力後に [削除] ボタンを押下。
5. DynamoDB ダッシュボードにてテーブルが削除されたことを確認。

### tfstate保存用S3バケット削除

tfstateを保存していたS3バケットを削除します。
S3バケット内にオブジェクトが存在しているとバケットが削除できないため、バケットを空→バケット削除の順に実施します。

1. AWSマネジメントコンソール上部の [サービス] タブより [S3] を選択。
2. S3ダッシュボードの左側ナビゲーションメニューから [バケット] を選択。
3. バケット一覧から[cnis-terraform-[AWSアカウントID]] を選択し、[空にする] ボタンを押下。
4. バケットを空にする画面にて、テキストフィールドに[完全に削除] と入力し、[空にする] ボタンを押下。
5. 正常に空になったことを確認し、[終了] ボタンを押下。
6. バケット一覧から[cnis-terraform-[AWSアカウントID]] を選択し、[削除] ボタンを押下。
7. バケットを空にする画面にて、テキストフィールドにバケット名を入力し、[バケットを削除] ボタンを押下。
8. 正常に削除されたことを確認。

以上で作成したリソース削除は完了です。
必要に応じてリポジトリ直下のREADME.mdに従ってCloud9を削除してください。

お疲れ様でした。

## 補足
- ニーズがあれば、ハンズオン資料を充実させたいと思うので、必要であればプルリク上げてください。

#### 参考

