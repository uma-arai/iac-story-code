# Terraformサンプルコード

## Overview
ここではTerraformのサンプルコードを提供します。
以下README.mdの内容に従って、pulumiを実行することができます。

## 前提事項
- リポジトリ直下のREADME.mdによる環境準備が完了していること。

## セットアップ

次にTerraformを実行するための各種インストールを行います。

### tfstate保存用S3バケットの作成

まずはTerraformステートファイルを保持するためのS3バケットを作成します。

1. AWSマネジメントコンソール上部の [サービス] タブより [S3] を選択。
2. S3ダッシュボードの左側ナビゲーションメニューから [バケット] を選択し、[+バケットを作成する] ボタンを押下。
3. [名前とリージョン] では、次のように各項目を入力後、 [次へ] ボタンを押下。

|項目名|値|
|-|-|
|バケット名|cnis-terraform-[AWSアカウントID]|
|リージョン|アジアパフィフィック(東京)|
|既存のバケットから設定をコピー|(入力なし)|

4. [オプションの設定] では、次のように各項目を入力後、 [次へ] ボタンを押下。

|項目名|値|
|-|-|
|バージョニング|チェックする|
|サーバーアクセスのログ|チェックしない|
|Tags|(入力なし)|
|オブジェクトレベルのログ記録|チェックしない|
|デフォルト暗号化|チェックする(AES-256を選択)|
|オブジェクトのロック|チェックしない|
|CloudWatchリクエストメトリクス|チェックしない|

5. [アクセス許可の設定] では、次のように各項目を入力後、 [次へ] ボタンを押下。

|項目名|値|
|-|-|
|パブリックアクセスをすべてブロック|チェックする|
|システムのアクセス許可を管理|Amazon S3ログ配信グループにこのバケットへの書き込みアクセス権限は付与しない|

5. [確認] にて入力内容を確認し、 [バケットの作成] ボタンを押下。

6. S3ダッシュボード上にてS3バケットが作成できていることを確認。

### 排他制御用のDynamoDBの作成

次にTerraformロックファイル管理用のDynamoDBテーブルを作成します。

1. AWSマネジメントコンソール上部の [サービス] タブより [DynamoDB] を選択。
2. DynamoDB ダッシュボードの左側ナビゲーションメニューから [テーブル] を選択し、[テーブルの作成] ボタンを押下。
3. [DynamoDBテーブルの作成] では、次のように各項目を入力後、 [作成] ボタンを押下。

|項目名|値|
|-|-|
|テーブル名|cnapp-terraform-state-lock|
|プライマリーキー|LockID(文字列)|
|ソートキーの追加|チェックしない|
|テーブル設定 - デフォルト設定の使用|チェックを外す|
|読み込み/書き込みキャパシティーモード|プロビジョンド|
|読み込みキャパシティー|チェックを外す|
|書き込みキャパシティー|チェックを外す|
|読み込みキャパシティーユニット|1|
|書き込みキャパシティーユニット|1|
|保管時の暗号化|デフォルト|

4. DynamoDBコンソール上にてテーブルが作成できていることを確認。

### tfenvのインストール

tfenvはTerraformのバージョン管理や切り替えが簡単に行えるオープンソースです。
今回、Terraformのインストールはtfenvで実施することで容易にバージョン管理可能な構成方針とします。

```bash
# インストール対象のディレクトリを作成
$ cd ~/environment
$ mkdir .tfenv

# Githubリポジトリからtfenvをダウンロードし、所定の場所にインストール
$ wget https://github.com/tfutils/tfenv/archive/v2.0.0.tar.gz

$ tar zxvf ./v2.0.0.tar.gz
$ mv tfenv-2.0.0/* .tfenv/

# tfenv実行に必要なパスを通す
$ echo 'export PATH="$HOME/environment/.tfenv/bin:$PATH"' >> ~/.bash_profile
$ source ~/.bash_profile

# バージョンの確認 (下記出力内容は2020年7月5時点の内容)
$ tfenv
tfenv 2.0.0
Usage: tfenv <command> [<options>]

Commands:
   install       Install a specific version of Terraform
   use           Switch a version to use
   uninstall     Uninstall a specific version of Terraform
   list          List all installed versions
   list-remote   List all installable versions

# 不要なファイルを削除
$ rm -rf tfenv-2.0.0*
$ rm v2.0.0.tar.gz
```

### Terraformのインストール

次にtfenv経由でTerraformをインストールします。

```bash
$ tfenv install 0.12.28
Installing Terraform v0.12.28
Downloading release tarball from https://releases.hashicorp.com/terraform/0.12.28/terraform_0.12.28_linux_amd64.zip
####################################################################################################################################################### 100.0%
Downloading SHA hash file from https://releases.hashicorp.com/terraform/0.12.28/terraform_0.12.28_SHA256SUMS
No keybase install found, skipping OpenPGP signature verification
Archive:  tfenv_download.bfeXAO/terraform_0.12.28_linux_amd64.zip
  inflating: /home/ec2-user/environment/.tfenv/versions/0.12.28/terraform  
Installation of terraform v0.12.28 successful. To make this your default version, run 'tfenv use 0.12.28'

# インストールしたバージョンの有効化
$ tfenv use 0.12.28
Switching default version to v0.12.28
Switching completed
$ tfenv list
* 0.12.28 (set by /home/ec2-user/.tfenv/version)

# terraformコマンドの実行確認
$ terraform -v
Terraform v0.12.28
>>>>>>> cnfs/chap-3_step-4
```

### Terragruntのインストール

今回はTerraformのラッパーツールであるTerragruntを利用します。
Terragruntを利用することで、コードの重複を減らす(DRY; Don't Repeat Yourself)ことができ、コードの管理がよりシンプルになります。
ここでは、Terragruntのインストール手順を実施していきます。

```bash
# Terragruntのダウンロード
$ cd ~/environment
$ wget https://github.com/gruntwork-io/terragrunt/releases/download/v0.23.31/terragrunt_linux_amd64

# ダウンロードしたバイナリファイルの配置
$ mv terragrunt_linux_amd64 terragrunt
$ chmod 755 terragrunt
$ sudo mv terragrunt /usr/local/bin/

# terragruntコマンドの実行確認
$ terragrunt -v
terragrunt version v0.23.31
```

以上でTerraform実行に必要な準備がすべて整いました。

## Terraformの実行

## アプリの疎通確認
// TODO

## 後片付け

### AWSリソースの削除

### 排他制御用のDynamoDBの削除

### tfstate保存用S3バケット削除

## 補足
- ニーズがあれば、ハンズオン資料を充実させたいと思うので、必要であればプルリク上げてください。

#### 参考

