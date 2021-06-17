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
| infrastructure | VPC、サブネットなどネットワーク周りやライフサイクルが遅いリソース |
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

## アプリの疎通確認
Cloud9の画面下部のターミナルから次のコマンドを実行してAPIリクエストをします。[ALBのDNS名]は自身のALBの名前でおきかえてください。

