## アカウント作成

Pulumiのアカウントを所有していない方のみ実施。

1. [Pulumi]https://app.pulumi.com/signup)のWebサイトに移動
2. GitHub, GitLab, Atlassian, Emailのいずれかでサインアップを行う
  - Full Name, Username, Email, Password

3. 以下の画面に遷移


4. Settingsメニュー
5. Access Tokens

6. descriptionにhandsonと入力

## セットアップ

### Pulumiのインストール
```bash
# Pulumiのバイナリダウンロード
$ wget https://get.pulumi.com/releases/sdk/pulumi-v3.4.0-linux-x64.tar.gz

# 展開してバイナリを配置&ゴミ消し
tar zxvf pulumi-v3.4.0-linux-x64.tar.gz; sudo mv pulumi/pulumi /usr/local/bin/ && rm -rf pulumi/ && rm -f pulumi-v3.4.0-linux-x64.tar.gz 

# バージョン確認
$ pulumi version
v3.4.0
```

### Goのインストール

```bash
# Goバイナリのダウンロード
$ wget https://golang.org/dl/go1.16.5.linux-amd64.tar.gz

# 展開してバイナリを配置
sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf go1.16.5.linux-amd64.tar.gz && rm -f go1.16.5.linux-amd64.tar.gz

# 最新のGoバイナリに置き換え
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bash_profile && echo "alias go='/usr/local/go/bin/go'" >> ~/.bash_profile && cat ~/.bash_profile | tail && source ~/.bash_profile  

# バージョン確認
& go version
go version go1.16.5 linux/amd64
```

## Pulumiの実行
```bash
$ cd ~/environment/iac-story-code/pulumi-go/

$ pulumi login 
Manage your Pulumi stacks by logging in.
Run `pulumi login --help` for alternative login options.
Enter your access token from https://app.pulumi.com/account/tokens
    or hit <ENTER> to log in using your browser                   : 

# 先程メモしたPulumi Access Tokenを入力
# 以下のように出力された成功

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

project name: (pulumi-go) 
project description: (A minimal AWS Go Pulumi program) 
Created project 'pulumi-go'

Please enter your desired stack name.
To create a stack in an organization, use the format <org-name>/<stack-name> (e.g. `acmecorp/dev`).
stack name: (dev) main
Created stack 'main'

aws:region: The AWS region to deploy into: (us-east-1) ap-northeast-1
Saved config

Installing dependencies...

Finished installing dependencies

Your new project is ready to go! 

To perform an initial deployment, run 'pulumi up'

# ファイル戻し
git checkout

go mod download github.com/pulumi/pulumi-aws/sdk/v4

# Pulumiのpreview

```


#### 参考
https://www.pulumi.com/docs/get-started/install/

