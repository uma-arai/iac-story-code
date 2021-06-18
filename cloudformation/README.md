# CloudFormation 

//TODO: Nested stackにする


## Overview
ここではCloudFormationのサンプルコードを提供します。
以下README.mdの内容に従って、CloudFormationを実行することができます。

## 前提事項
- リポジトリ直下のREADME.mdによる環境準備が完了していること。

## セットアップ

### ツールのバージョン

本書でも説明したとおり、CloudFormationのメリットはJSON/YAMLが記述できるエディタさえあれば、追加のツールなしでも実行できる点です。

本ハンズオンでももちろん、提供するYAMLをそのままCloudFormationダッシュボードからアップロードするだけで実行も可能です。

しかし、毎回GUIを操作してファイルをアップロードすることも手間です。
本ハンズオンでは**AWS CLI**を利用してCloudFormationのスタックを作成します。

Cloud9にはデフォルトでAWS CLIがインストールされており、追加の設定は不要です。
AWS CLIのバージョンは次のとおりです。

```bash
$ aws --version
aws-cli/1.19.94 Python/2.7.18 Linux/4.14.232-176.381.amzn2.x86_64 botocore/1.20.94
```

### テンプレート格納用S3の作成

```bash
# アカウントIDの取得
$ AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)
# バケット名の設定
$ BUCKET_NAME=cnis-cfn-bucket-${AWS_ACCOUNT_ID}
# リージョン名の設定
$ REGION=ap-northeast-1
# S3の作成とパブリックアクセスの禁止設定
$ aws s3api create-bucket \
    --bucket ${BUCKET_NAME} \
    --region ${REGION} \
    --create-bucket-configuration LocationConstraint=${REGION}
$ aws s3api put-public-access-block \
    --bucket $BUCKET_NAME \
    --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

## CloudFormationの実行

いよいよサンプルソースコードを利用してAWSリソースを作成します。
今回、CloudFormationでは3つのスタックを用意しています。

| スタック           | 内容                                 |
|----------------|------------------------------------|
| infrastructure | VPC、サブネットなどネットワーク周りやライフサイクルが長いリソース |
| app-base       | ECRなどアプリに必要なベースリソース                |
| application    | ECSサービスなどアプリに必要なリソース               |

それぞれのテンプレートからスタックを作成して、リソースをデプロイします。

### NestしたテンプレートをS3にアップロード

サンプルコードではフラットにCloudFormationを記述するのではなく、Nested Stackを利用しています。親となるスタックからNestされたスタックを利用するためにはテンプレートのURLを指定します。S3にNestしたテンプレートを格納し、S3のURLを指定することとします。

```bash
$ aws s3 cp infrastructure/ s3://${BUCKET_NAME}/infra --recursive
$ aws s3 cp app-base/ s3://${BUCKET_NAME}/appbase --recursive
$ aws s3 cp application/ s3://${BUCKET_NAME}/app --recursive
```

### infrastructureスタックのデプロイ

```bash
$ pwd
/home/ec2-user/environment/iac-story-code/cloudformation

# IAMの作成を伴うのでcapabilitiesの指定が必要
$ aws cloudformation create-stack --stack-name cnis-infrastructure --template-body file://infrastructure.yml --capabilities CAPABILITY_NAMED_IAM                                                                                         
{
    "StackId": "arn:aws:cloudformation:ap-northeast-1:xxxxxxxx:stack/cnis-infrastructure/addb4cf0-cfdb-11eb-8dff-0e9cfcf32e9f"
}
```

### app-baseスタックのデプロイ

```bash
$ pwd
/home/ec2-user/environment/iac-story-code/cloudformation

$ aws cloudformation create-stack --stack-name cnis-infrastructure --template-body file://infrastructure.yml --capabilities CAPABILITY_NAMED_IAM                                                     ```


### applicationスタックのデプロイ

```bash
$ pwd
/home/ec2-user/environment/iac-story-code/cloudformation

$ aws cloudformation create-stack --stack-name cnis-application --template-body file://application.yml                                                                           
{
    "StackId": "arn:aws:cloudformation:ap-northeast-1:xxxxxxxx:stack/cnis-infrastructure/addb4cf0-cfdb-11eb-8dff-0e9cfcf32e9f"
}
```



## 補記
- 2021年6月現在、CloudFormation にはCloudFormation Modulesが用意されていますが、今回は利用しません。
    - テンプレートよりさらに細かい粒度のモジュールを定義できる機能です。
        - 2021年4月にYAMLがサポートされてようやく書ける体制が整いつつある状態です。
            - https://aws.amazon.com/jp/about-aws/whats-new/2021/04/aws-cloudformation-modules-provides-yaml-delimiter-support/
    - モジュール利用のためには事前にCloudFormation レジストリへのモジュール登録が必要です。
        - モジュール登録がかなり手間で微妙なので今回は利用を見送りました。


