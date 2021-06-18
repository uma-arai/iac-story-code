# AWS CDKサンプルコード

## Overview
ここではAWS CDK(以降、CDK)のサンプルコードを提供します。
以下README.mdの内容に従って、CDKを実行することができます。

## 前提事項
- リポジトリ直下のREADME.mdによる環境準備が完了していること。

## セットアップ

### ツールのバージョン

今回ハンズオン環境として利用するCloud9にはデフォルトでCDKがインストールされています。
2021年6月17日現在、Cloud9インスタンスを新しく起動してインストールされているバージョンは次のとおりです。

- AWS CDK: 1.108.1
  - Node.js: v10.24.1

本ハンズオンでは上記バージョンと筆者のローカル環境のバージョン（リポジトリ直下のREADME.mdのバージョン）で動作を確認しています。
しかし、Cloud9起動時に利用するAMIはAWS側で管理されています。
そのため、今後ライブラリのバージョンが上がる可能性があります。異なるバージョンで動作しない場合はこれらのバージョンやリポジトリ直下のREADME.mdのバージョンを参考にしてください。

### 環境変数の設定

前提事項の作業の中で、`aws_access_key_id`と`aws_secret_access_key`、`aws_region`を設定しました。
CDKを利用する際、環境変数に対してもこれらを設定してください。
厳密には設定する必要はなく、AWSアカウントIDとリージョンのみ指定すればOKです。
しかし、Cloud9環境の場合、これらを設定して実行しなければうまく動作しなかったためです。
TODO: もう一度見直す

```
$ export AWS_ACCESS_KEY_ID=******
$ export AWS_SECRET_ACCESS_KEY=******
$ export AWS_REGION=ap-northeast-1
```

### CloudFormationで利用するS3のセットアップ

次のコマンドでCDKコマンド実行時に利用するCloudFormationのS3をセットアップしてください。

```bash
$ cdk bootstrap
```

コマンド実行後、S3に[cdk]と名のつくS3バケットが生成されたことを確認してください。



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

```bash
$ pwd
/home/ec2-user/environment/iac-story-code/cdk-typescript

$ npm run deploy:dev:base
```

### app-baseスタックのデプロイ

```bash
$ pwd
/home/ec2-user/environment/iac-story-code/cdk-typescript

$ npm run deploy:dev:appb
```


### managementスタックのデプロイ

```bash
$ pwd
/home/ec2-user/environment/iac-story-code/cdk-typescript

$ npm run deploy:dev:iam
```

### ECRへコンテナイメージの登録
TODO：新井さんのを持ってくる


### appスタックのデプロイ

```bash
$ pwd
/home/ec2-user/environment/iac-story-code/cdk-typescript

$ npm run deploy:dev:app
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

```bash
$ npm run destroy:all
```

### CloudFormationで利用するS3の削除

TODO: 
