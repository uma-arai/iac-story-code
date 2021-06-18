# AWS CDKサンプルコード

## Overview
ここではAWS CDK(以降、CDK)のサンプルコードを提供します。
以下README.mdの内容に従って、CDKを実行することができます。

## 前提事項
- リポジトリ直下のREADME.mdによる環境準備が完了していること。

## セットアップ

CDKを実行するための事前設定を行います。

### ツールのバージョン

今回ハンズオン環境として利用するCloud9にはデフォルトでCDKがインストールされています。
2021年6月17日現在、Cloud9インスタンスを新しく起動してインストールされているバージョンは次のとおりです。

- AWS CDK: 1.108.1
  - Node.js: v10.24.1

本ハンズオンでは上記バージョンと筆者のローカル環境のバージョン（リポジトリ直下のREADME.mdのバージョン）で動作を確認しています。
しかし、Cloud9起動時に利用するAMIはAWS側で管理されています。
そのため、今後ライブラリのバージョンが上がる可能性があります。異なるバージョンで動作しない場合はこれらのバージョンやリポジトリ直下のREADME.mdのバージョンを参考にしてください。

### 依存モジュールのインストール

TypeScriptをビルドするための依存モジュールのインストールをします。次のコマンドを実行してください。

```bash
$ pwd
/home/ec2-user/environment/iac-story-code/cdk-typescript

$ npm install
> aws-sdk@2.903.0 postinstall /home/ec2-user/environment/iac-story-code/cdk-typescript/node_modules/aws-cdk/node_modules/aws-sdk
> node scripts/check-node-version.js


> cdk-typescript@0.1.0 postinstall /home/ec2-user/environment/iac-story-code/cdk-typescript
> npx patch-package

npx: installed 50 in 3.825s
︙
```

### 環境変数の設定

前提事項の作業の中で、`aws_access_key_id`と`aws_secret_access_key`、`aws_region`を設定しました。
CDKを利用する際、環境変数に対してもこれらを設定してください。
厳密には設定する必要はなく、AWSアカウントIDとリージョンのみ指定すればOKです。
しかし、Cloud9環境の場合、これらを設定して実行しなければうまく動作しなかったためです。
TODO: もう一度見直す

Unable to resolve AWS account to use. It must be either configured when you define your CDK or through the environment


```
$ export AWS_ACCESS_KEY_ID=******
$ export AWS_SECRET_ACCESS_KEY=******
$ export AWS_REGION=ap-northeast-1
```

### CloudFormationで利用するS3のセットアップ

次のコマンドでCDKコマンド実行時に利用するCloudFormationのS3をセットアップしてください。

```bash
$ pwd
/home/ec2-user/environment/iac-story-code/cdk-typescript

$ npm run setup
> cdk-typescript@0.1.0 setup /home/ec2-user/environment/iac-story-code/cdk-typescript
> cdk bootstrap

 ⏳  Bootstrapping environment aws://xxxxxxxx/ap-northeast-1...
CDKToolkit: creating CloudFormation changeset...
[██████████████████████████████████████████████████████████] (3/3)



 ✅  Environment aws://xxxxxxxx/ap-northeast-1 bootstrapped.
```

コマンド実行後、S3に[cdktoolkit]と名のつくS3バケットが生成されたことを確認してください。


## CDKの実行

いよいよサンプルソースコードを利用してAWSリソースを作成します。
今回、CDKでは4つのスタックを用意しています。

| スタック           | 内容                                 |
|----------------|------------------------------------|
| infrastructure | VPC、サブネットなどネットワーク周りやライフサイクルが長いリソース |
| app-base       | ECRなどアプリに必要なベースリソース                |
| management     | IAMリソース                            |
| app            | ECSサービスなどアプリに必要なリソース               |


まず`infrastructure` -> `app-base` -> `management`の順番に展開していきます。
その後、Cloud9からコンテナイメージをECRに登録後、`app`を展開します。

### infrastructureスタックのデプロイ

Cloud9 IDEを開き、画面下部のコマンドラインにて以下を入力してCDKの実行をします。

```bash
$ pwd
/home/ec2-user/environment/iac-story-code/cdk-typescript

$ npm run deploy:dev:base
> cdk-typescript@0.1.0 deploy:dev:base /home/ec2-user/environment/iac-story-code/cdk-typescript
> cdk deploy cnis-infra --context env=dev

[Warning at /cnis-infra/cnis-securityGroup/ingress] Ignoring Egress rule since 'allowAllOutbound' is set to true; To add customize rules, set allowAllOutbound=false on the SecurityGroup
[Warning at /cnis-infra/cnis-securityGroup/ingress] Ignoring Egress rule since 'allowAllOutbound' is set to true; To add customize rules, set allowAllOutbound=false on the SecurityGroup
[Warning at /cnis-infra/cnis-securityGroup/app] Ignoring Egress rule since 'allowAllOutbound' is set to true; To add customize rules, set allowAllOutbound=false on the SecurityGroup
[Warning at /cnis-infra/cnis-securityGroup/app] Ignoring Egress rule since 'allowAllOutbound' is set to true; To add customize rules, set allowAllOutbound=false on the SecurityGroup
This deployment will make potentially sensitive changes according to your current security approval level (--require-approval broadening).
Please confirm you intend to make the following modifications:

Security Group Changes
┌───┬───────────────────────────────────────┬─────┬────────────┬───────────────────────────────────────┐
│   │ Group                                 │ Dir │ Protocol   │ Peer                                  │
├───┼───────────────────────────────────────┼─────┼────────────┼───────────────────────────────────────┤
│ + │ ${cnis-securityGroup/app.GroupId}     │ In  │ TCP 80     │ ${cnis-securityGroup/ingress.GroupId} │
│ + │ ${cnis-securityGroup/app.GroupId}     │ Out │ Everything │ Everyone (IPv4)                       │
├───┼───────────────────────────────────────┼─────┼────────────┼───────────────────────────────────────┤
│ + │ ${cnis-securityGroup/egress.GroupId}  │ In  │ TCP 443    │ ${cnis-securityGroup/app.GroupId}     │
│ + │ ${cnis-securityGroup/egress.GroupId}  │ Out │ Everything │ Everyone (IPv4)                       │
├───┼───────────────────────────────────────┼─────┼────────────┼───────────────────────────────────────┤
│ + │ ${cnis-securityGroup/ingress.GroupId} │ In  │ TCP 80     │ Everyone (IPv4)                       │
│ + │ ${cnis-securityGroup/ingress.GroupId} │ In  │ TCP 80     │ Everyone (IPv6)                       │
│ + │ ${cnis-securityGroup/ingress.GroupId} │ Out │ Everything │ Everyone (IPv4)                       │
└───┴───────────────────────────────────────┴─────┴────────────┴───────────────────────────────────────┘
(NOTE: There may be security-related changes not in this list. See https://github.com/aws/aws-cdk/issues/1299)

Do you wish to deploy these changes (y/n)? y #"y"を入力してください
cnis-infra: deploying...
cnis-infra: creating CloudFormation changeset...
︙

 ✅  cnis-infra

Outputs:
cnis-infra.ExportsOutputFnGetAttcnissecurityGroupapp44B9640FGroupIdDD26EB74 = sg-0020ba4abccc3f8f2
︙

Stack ARN:
arn:aws:cloudformation:ap-northeast-1:xxxxxxx:stack/cnis-infra/c05da5b0-d03c-11eb-ab2a-0a03c4f678f1
```

VPCやサブネット周りのリソースが作成できたことを確認してください。
1点、ほかのIaCサービスと異なり、いくつかの値についてはCDKのデフォルト値を利用しています。
たとえば、サブネットのNameタグやCIDRです。本書で説明したとおり、L2 constructsをL1 constructsに変換すれば値の設定が可能ですが、そこの手間をかけるよりはCDKのプラクティスに乗ったほうがよいという判断のもとです。L2 constructsの設定値で簡単に設定ができる名称などについては設定をしています。

### app-baseスタックのデプロイ

同様にコマンドラインにて以下を入力してCDKの実行をします。

```bash
$ pwd
/home/ec2-user/environment/iac-story-code/cdk-typescript

$ npm run deploy:dev:appb

> cdk-typescript@0.1.0 deploy:dev:appb /home/ec2-user/environment/iac-story-code/cdk-typescript
> cdk deploy cnis-app-base --context env=dev

cnis-app-base: deploying...
cnis-app-base: creating CloudFormation changeset...
[██████████████████████████████████████████████████████████] (4/4)

 ✅  cnis-app-base

Outputs:
︙
Stack ARN:
arn:aws:cloudformation:ap-northeast-1:xxxxxxx:stack/cnis-app-base/716d40e0-d03d-11eb-803a-0e15c04a62a9
```

ECRができていることを確認してください。ここで作成したECRに対して後続でアプリケーションコンテナを登録します。

### managementスタックのデプロイ

同様にコマンドラインにて以下を入力してCDKの実行をします。

```bash
$ pwd
/home/ec2-user/environment/iac-story-code/cdk-typescript

$ npm run deploy:dev:iam
> cdk-typescript@0.1.0 deploy:dev:iam /home/ec2-user/environment/iac-story-code/cdk-typescript
> cdk deploy cnis-management --context env=dev
︙
cnis-app-base
cnis-app-base: deploying...

 ✅  cnis-app-base (no changes)

︙
cnis-infra
cnis-infra: deploying...

 ✅  cnis-infra (no changes)

︙
cnis-management
This deployment will make potentially sensitive changes according to your current security approval level (--require-approval broadening).
Please confirm you intend to make the following modifications:

IAM Statement Changes
┌───┬────────────────────────────────────────┬────────┬────────────────────────────────────────┬──────────────────────────────────────────┬───────────┐
│   │ Resource                               │ Effect │ Action                                 │ Principal                                │ Condition │
├───┼────────────────────────────────────────┼────────┼────────────────────────────────────────┼──────────────────────────────────────────┼───────────┤
│ + │ ${iam/cnis-ecs-task-execution-role.Arn │ Allow  │ sts:AssumeRole                         │ Service:ecs-tasks.amazonaws.com          │           │
│   │ }                                      │        │                                        │                                          │           │
├───┼────────────────────────────────────────┼────────┼────────────────────────────────────────┼──────────────────────────────────────────┼───────────┤
│ + │ *                                      │ Allow  │ ecr:GetAuthorizationToken              │ AWS:${iam/cnis-ecs-task-execution-role}  │           │
│ + │ *                                      │ Allow  │ ssm:GetParameters                      │ AWS:${iam/cnis-ecs-task-execution-role}  │           │
├───┼────────────────────────────────────────┼────────┼────────────────────────────────────────┼──────────────────────────────────────────┼───────────┤
│ + │ arn:${AWS::Partition}:ssm:${AWS::Regio │ Allow  │ ssm:DescribeParameters                 │ AWS:${iam/cnis-ecs-task-execution-role}  │           │
│   │ n}:${AWS::AccountId}:parameter/{"Fn::I │        │ ssm:GetParameter                       │                                          │           │
│   │ mportValue":"cnis-infra:ExportsOutputR │        │ ssm:GetParameterHistory                │                                          │           │
│   │ efcnisparameterscniscnisssmparamcnisap │        │ ssm:GetParameters                      │                                          │           │
│   │ pD15C26FFF42C93AD"}                    │        │                                        │                                          │           │
├───┼────────────────────────────────────────┼────────┼────────────────────────────────────────┼──────────────────────────────────────────┼───────────┤
│ + │ {"Fn::ImportValue":"cnis-app-base:Expo │ Allow  │ logs:CreateLogStream                   │ AWS:${iam/cnis-ecs-task-execution-role}  │           │
│   │ rtsOutputFnGetAttcnislogsapp848B70BFAr │        │ logs:PutLogEvents                      │                                          │           │
│   │ nB0042003"}                            │        │                                        │                                          │           │
├───┼────────────────────────────────────────┼────────┼────────────────────────────────────────┼──────────────────────────────────────────┼───────────┤
│ + │ {"Fn::ImportValue":"cnis-app-base:Expo │ Allow  │ ecr:BatchCheckLayerAvailability        │ AWS:${iam/cnis-ecs-task-execution-role}  │           │
│   │ rtsOutputFnGetAttcnisrepositoryE55FBBC │        │ ecr:BatchGetImage                      │                                          │           │
│   │ 3Arn048AF67D"}                         │        │ ecr:GetDownloadUrlForLayer             │                                          │           │
└───┴────────────────────────────────────────┴────────┴────────────────────────────────────────┴──────────────────────────────────────────┴───────────┘
IAM Policy Changes
┌───┬─────────────────────────────────────┬───────────────────────────────────────────────────────────────────────┐
│   │ Resource                            │ Managed Policy ARN                                                    │
├───┼─────────────────────────────────────┼───────────────────────────────────────────────────────────────────────┤
│ + │ ${iam/cnis-ecs-task-execution-role} │ arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy │
└───┴─────────────────────────────────────┴───────────────────────────────────────────────────────────────────────┘
(NOTE: There may be security-related changes not in this list. See https://github.com/aws/aws-cdk/issues/1299)

Do you wish to deploy these changes (y/n)? y #"y"を入力してください
cnis-management: deploying...
cnis-management: creating CloudFormation changeset...
[██████████████████████████████████████████████████████████] (5/5)

 ✅  cnis-management

Outputs:
cnis-management.ExportsOutputFnGetAttiamcnisecstaskexecutionroleF8C24C49Arn86319A74 = arn:aws:iam::xxxxxxxx:role/cnisEcsTaskExecutionRole

Stack ARN:
arn:aws:cloudformation:ap-northeast-1:xxxxxxxx:stack/cnis-management/b8ca72f0-d03d-11eb-a6f0-06d5b63015d5
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


### appスタックのデプロイ

コマンドラインにて以下を入力してCDKの実行をします。

```bash
$ cd ~/environment/iac-story-code/cdk-typescript
$ pwd
/home/ec2-user/environment/iac-story-code/cdk-typescript

$ npm run deploy:dev:app
> cdk-typescript@0.1.0 deploy:dev:app /home/ec2-user/environment/iac-story-code/cdk-typescript
> cdk deploy cnis-app --context env=dev

Including dependency stacks: cnis-infra, cnis-app-base, cnis-management
︙
cnis-app-base
cnis-app-base: deploying...

 ✅  cnis-app-base (no changes)

︙
cnis-infra
cnis-infra: deploying...

 ✅  cnis-infra (no changes)

︙
cnis-manage
cnis-management: deploying...

 ✅  cnis-management (no changes)

︙
IAM Statement Changes
┌───┬─────────────────────────────┬────────┬────────────────┬─────────────────────────────────┬───────────┐
│   │ Resource                    │ Effect │ Action         │ Principal                       │ Condition │
├───┼─────────────────────────────┼────────┼────────────────┼─────────────────────────────────┼───────────┤
│ + │ ${ecs-taskdef/TaskRole.Arn} │ Allow  │ sts:AssumeRole │ Service:ecs-tasks.amazonaws.com │           │
└───┴─────────────────────────────┴────────┴────────────────┴─────────────────────────────────┴───────────┘
(NOTE: There may be security-related changes not in this list. See https://github.com/aws/aws-cdk/issues/1299)

Do you wish to deploy these changes (y/n)? y #"y"を入力してください
cnis-app: deploying...
cnis-app: creating CloudFormation changeset...
[██████████████████████████████████████████████████████████] (10/10)

 ✅  cnis-app

Stack ARN:
arn:aws:cloudformation:ap-northeast-1:xxxxxxxx:stack/cnis-app/27861db0-d03f-11eb-96a0-0e9105d7f1cd

```

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
# Ctrl+C で停止
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

### ECRのコンテナイメージの削除

ECRにコンテナイメージが残っている状態でリポジトリを削除しようとすると次のエラーが発生します。
エラーメッセージでは「このリポジトリにコンテナイメージが含まれているから削除できません」という内容です。

```
Resource handler returned message: "The repository with name 'cnis-ecr-app' in registry with id 'xxxxxxx' cannot be deleted because it still contains images
```

Cloud9から次のコマンドを実行してECRに格納されているイメージを削除します。

```bash
$ aws ecr batch-delete-image \
> --repository-name cnis-ecr-app \
> --image-ids imageTag=init

{
    "failures": [], 
    "imageIds": [
        {
            "imageTag": "init", 
            "imageDigest": "sha256:759116eef9c1d191dc83a574220a9052a6af555dac6a369da7cb8b5ce8563e13"
        }
    ]
}
```

`failures`が空となっていれば完了です。ECRのダッシュボードでコンテナイメージが削除され、イメージが存在しないことを確認してください。

### AWSリソースの削除

コマンドラインにて以下を入力してCDKで作成したリソースの破棄をします。
Yes/Noがきかれるので、`y`を入力して破棄コマンドを実行してください。

```bash
$ npm run destroy:all
```

### CloudFormationで利用するS3の削除

TODO: 
