# Pulumiサンプルコード

## Overview
ここではGo言語によるPulumiのサンプルコードを提供します。
以下README.mdの内容に従って、pulumiを実行することができます。

## 前提事項
- リポジトリ直下のREADME.mdによる環境準備が完了していること。

## アカウント作成

Pulumiでは利用前にPulumiアカウントの登録が必要です。
Pulumiのアカウントを所有していない方は以下手順に従って作成しましょう。

1. [Pulumi](https://app.pulumi.com/signup)のWebサイトに移動
2. GitHub, GitLab, Atlassian, Emailのいずれかでサインアップを行う。
3. サインアップ後、[Settings] → [Access Tokens] に移動
4. [Create token]ボタンを押下し、表示されたポップアップ画面にてdescriptionに`handson`と入力後、[Create token]ボタンを押下
5. 作成されたAccess Tokens情報を控えておく。

## セットアップ

次にPulumiを実行するための各種インストールを行います。

### Pulumiのインストール

1. Cloud9 IDEを開き、画面下部のコマンドラインにて以下を入力。

```bash
# Pulumiのバイナリダウンロード
$ VERSION=3.25.0
$ wget https://get.pulumi.com/releases/sdk/pulumi-v${VERSION}-linux-x64.tar.gz

# 展開してバイナリを配置&ゴミ消し
tar zxvf pulumi-v${VERSION}-linux-x64.tar.gz; sudo mv -f pulumi/* /usr/local/bin/ && rm -rf pulumi/ && rm -f pulumi-v${VERSION}-linux-x64.tar.gz 

# バージョン確認
$ pulumi version
v3.25.0
```

### Goのインストール

1. Cloud9 IDEを開き、画面下部のコマンドラインにて以下を入力。

```bash
# Goバイナリのダウンロード
$ wget https://golang.org/dl/go1.16.5.linux-amd64.tar.gz

# 展開してバイナリを配置
$ sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf go1.16.5.linux-amd64.tar.gz && rm -f go1.16.5.linux-amd64.tar.gz

# 最新のGoバイナリに置き換え
$ echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bash_profile && echo "alias go='/usr/local/go/bin/go'" >> ~/.bash_profile && cat ~/.bash_profile | tail && source ~/.bash_profile  

# バージョン確認
$ go version
go version go1.16.5 linux/amd64
```

以上でPulumiを実行するための環境が整いました。

## Pulumiの実行

では実際にサンプルコードでPulumiによるAWSリソースを作成してみましょう。

1. Cloud9 IDEを開き、画面下部のコマンドラインにて以下を入力。
```bash
# 作業ディレクトリへ移動
$ cd ~/environment/iac-story-code/pulumi-go/

# pulumiへのログイン
$ pulumi login 
Manage your Pulumi stacks by logging in.
Run `pulumi login --help` for alternative login options.
Enter your access token from https://app.pulumi.com/account/tokens
    or hit <ENTER> to log in using your browser                   : 

# 先程メモしたPulumi Access Tokenを入力してください。
# 以下のように出力されたら成功です。

  Welcome to Pulumi!

  Pulumi helps you create, deploy, and manage infrastructure on any cloud using
  your favorite language. You can get started today with Pulumi at:

      https://www.pulumi.com/docs/get-started/

  Tip of the day: Resources you create with Pulumi are given unique names (a randomly
  generated suffix) by default. To learn more about auto-naming or customizing resource
  names see https://www.pulumi.com/docs/intro/concepts/programming-model/#autonaming.


Logged in to pulumi.com as xxxxxxxxxx (https://app.pulumi.com/xxxxxxxxxx)

## プロジェクトの作成
$ pulumi new aws-go --force
This command will walk you through creating a new Pulumi project.

Enter a value or leave blank to accept the (default), and press <ENTER>.
Press ^C at any time to quit.

project name: (pulumi-go) 	   # プロジェクト名の入力（デフォルトでOK）
project description: (A minimal AWS Go Pulumi program) 
Created project 'pulumi-go'	

Please enter your desired stack name.
To create a stack in an organization, use the format <org-name>/<stack-name> (e.g. `acmecorp/dev`).
stack name: (dev) main         # スタック名の入力（mainと入力すること）
Created stack 'main'            

aws:region: The AWS region to deploy into: (us-east-1) ap-northeast-1    # リージョンを入力(ap-northeast-1と入力すること)
Saved config

Installing dependencies...

Finished installing dependencies

Your new project is ready to go! 

To perform an initial deployment, run 'pulumi up'

# pulumiプロジェクトを作成した際、いくつかのファイルが更新されてしまうので、restoreで戻しておく
$ git restore Pulumi.main.yaml go.mod main.go

# パラメータストアに秘匿な情報を受け渡すため、以下のようにシークレットを追加する
$ pulumi config set --secret cnis:secret_value "Cloud Native IaC Story"

# 実行前にPreviewで確認しましょう。
# サンプルコードでは環境変数としてAWSアカウントIDを読み込む必要があるため、
# 以下により環境変数として格納しておきます。
$ export AWS_ACCOUNT_ID=`aws sts get-caller-identity | jq .Account -r` && env | grep AWS_ACCOUNT_ID

# Previewを見てみましょう。
# プロバイダーのダウンロードに少し時間がかかります。
$ pulumi preview
Previewing update (main)

View Live: https://app.pulumi.com/m-arai/pulumi-go/main/previews/568ed8a3-25b0-44bd-bf25-74e9b5036d5a

[resource plugin aws-4.7.0] installing
Downloading plugin: 75.17 MiB / 75.17 MiB [=========================] 100.00% 1s
     Type                                               Name                                               Plan       
 +   pulumi:pulumi:Stack                                pulumi-go-main                                     create     
 +   ├─ aws:ssm:Parameter                               cnis-ssm-param-cnis-app                            create     
 +   ├─ aws:iam:Role                                    cnis-ecs-task-execution-role                       create     
 +   ├─ aws:ecs:Cluster                                 cnis-ecs-cluster-app                               create     
 +   │  └─ aws:ecs:Service                              cnis-ecs-service-app                               create     
 +   ├─ aws:iam:Policy                                  cnis-ecs-task-execution-policy                     create     
 +   ├─ aws:ec2:Vpc                                     cnis-vpc-main                                      create     
 +   │  ├─ aws:alb:TargetGroup                          cnis-alb-tg-app                                    create     
 +   │  ├─ aws:ec2:Subnet                               cnis-subnet-private-egress-c                       create     
 +   │  ├─ aws:ec2:RouteTable                           cnis-rt-internal                                   create     
 +   │  │  ├─ aws:ec2:RouteTableAssociation             cnis-rta-internal-private-app-a                    create     
 +   │  │  ├─ aws:ec2:VpcEndpointRouteTableAssociation  cnis-rta-internal-vpce-s3                          create     
 +   │  │  └─ aws:ec2:RouteTableAssociation             cnis-rta-internal-private-app-c                    create     
 +   │  ├─ aws:ec2:InternetGateway                      cnis-igw-main                                      create     
 +   │  ├─ aws:ec2:Subnet                               cnis-subnet-public-ingress-a                       create     
 +   │  ├─ aws:ec2:Subnet                               cnis-subnet-private-egress-a                       create     
 +   │  ├─ aws:ec2:Subnet                               cnis-subnet-private-app-a                          create     
 +   │  ├─ aws:ec2:VpcEndpoint                          cnis-vpce-s3                                       create     
 +   │  ├─ aws:ec2:Subnet                               cnis-subnet-public-ingress-c                       create     
 +   │  ├─ aws:ec2:Subnet                               cnis-subnet-private-app-c                          create     
 +   │  ├─ aws:ec2:RouteTable                           cnis-rt-public                                     create     
 +   │  │  ├─ aws:ec2:RouteTableAssociation             cnis-rta-public-public-ingress-a                   create     
 +   │  │  └─ aws:ec2:RouteTableAssociation             cnis-rta-public-public-ingress-c                   create     
 +   │  ├─ aws:alb:LoadBalancer                         cnis-alb-app                                       create     
 +   │  │  └─ aws:lb:Listener                           cnis-alb-lsnr-app                                  create     
 +   │  ├─ aws:ec2:VpcEndpoint                          cnis-vpce-ssm                                      create     
 +   │  ├─ aws:ec2:VpcEndpoint                          cnis-vpce-logs                                     create     
 +   │  ├─ aws:ec2:VpcEndpoint                          cnis-vpce-ecr-dkr                                  create     
 +   │  └─ aws:ec2:VpcEndpoint                          cnis-vpce-ecr-api                                  create     
 +   ├─ aws:cloudwatch:LogGroup                         cnis-logs-app                                      create     
 +   ├─ aws:ecr:Repository                              cnis-ecr-app                                       create     
 +   ├─ aws:iam:RolePolicyAttachment                    cnis-ecs-task-execution-managed-policy-attachment  create     
 +   ├─ aws:iam:RolePolicyAttachment                    cnis-ecs-task-execution-policy-attachment          create     
 +   ├─ aws:ec2:SecurityGroup                           cnis-sg-public-ingress                             create     
 +   ├─ aws:ecs:TaskDefinition                          cnis-ecs-taskdef-app                               create     
 +   ├─ aws:ec2:SecurityGroup                           cnis-sg-private-app                                create     
 +   └─ aws:ec2:SecurityGroup                           cnis-sg-private-egress                             create     
 
Resources:
    + 37 to create  

# Upによる実際のAWSリソース作成
$ pulumi up
:
Resources:
    + 37 to create

# 下記のように選択を求められたら、必要に応じてdetailsを選択し、設定内容を確認します。
# その後、問題なければyesを選択してリソースを作成します。
Do you want to perform this update?  [Use arrows to move, enter to select, type to filter]
> yes
  no
  details

# Pulumi Upが実行されるので、以下の様に出力されるとAWSリソース作成が完了です。
:
Resources:
    + 37 created

Duration: 2m44s

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
$ AWS_ACCOUNT_ID=`aws sts get-caller-identity | jq .Account -r`; $(aws ecr get-login --no-include-email --registry-ids ${AWS_ACCOUNT_ID} --region ap-northeast-1)
:
Login Succeeded

# ECRにプッシュするためにコンテナイメージ名をECR URLに変更
$ AWS_ECR_URL=`aws ecr describe-repositories | jq .repositories[].repositoryUri -r | grep cnis-ecr-app`; docker tag ${CONTAINER_NAME}:${CONTAINER_TAG} ${AWS_ECR_URL}:${CONTAINER_TAG}

# コンテナイメージのプッシュ
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
{
    "taskArns": [
        "arn:aws:ecs:ap-northeast-1:123456789012:task/cnis-ecs-cluster-app/8e2be702a59a4d5d9847b0f1cfdb52b0"
    ]
}
:
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

### AWSリソースの削除

1. Cloud9 IDEを開き、画面下部のコマンドラインにて以下を入力。
```bash
# Pulumiのリソース削除はdestroyで実行します。
$ cd ~/environment/iac-story-code/pulumi-go/
$ pulumi destroy
Previewing destroy (main)

View Live: https://app.pulumi.com/m-arai/pulumi-go/main/previews/535c0c4d-f8e7-4f00-9153-584a6898ec17

:

Resources:
    - 37 to delete

# 作成時と同じように聞かれるので、消してよければyesを選択します。
Do you want to perform this destroy?  [Use arrows to move, enter to select, type to filter]
> yes
  no
  details

# すると以下のようにリソースがまとめて削除されます。
Do you want to perform this destroy? yes
Destroying (main)

View Live: https://app.pulumi.com/m-arai/pulumi-go/main/updates/4

:
Resources:
    - 37 deleted

Duration: 4m56s

The resources in the stack have been deleted, but the history and configuration associated with the stack are still maintained. 
If you want to remove the stack completely, run 'pulumi stack rm main'.
```
### Pulumiスタックの削除

作成したPulumiスタックを削除します。
```bash
$ pulumi stack rm main
This will permanently remove the 'main' stack!
Please confirm that this is what you'd like to do by typing ("main"): main  # mainと入力
Stack 'main' has been removed!
```

### Pulumiアカウントの削除

最後にPulumiアカウントを削除します。
1人で利用する分には無料であり、こちらは必要に応じて実施してください。

1. [Pulumi](https://app.pulumi.com/signin)のWebサイトに移動し、サインイン
2. サインイン後、[Settings] → [General] に移動
3. [Delete account]ボタンを押下し、表示の指示に従ってテキストボックスを入力後、[Delete account]ボタンを押下

## 補足
- ニーズがあれば、ハンズオン資料を充実させたいと思うので、必要であればスターやプルリクください。

#### 参考
https://www.pulumi.com/docs/get-started/install/

