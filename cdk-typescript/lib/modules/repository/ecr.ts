import { env } from "../../../environment";
import { IRepository, Repository, TagMutability } from "aws-cdk-lib/aws-ecr";
import { Construct } from "constructs";
import { RemovalPolicy } from "aws-cdk-lib";

interface IContainerRepositoryProps {
  imported?: boolean; // 開発用途。基本的にはfalse
}

export class ContainerRepository extends Construct {
  readonly repository: IRepository;

  constructor(scope: Construct, id: string, props: IContainerRepositoryProps) {
    super(scope, id);

    const { imported } = props;
    const repositoryName = `${env.global.servicePrefix}-ecr-app`;

    // NOTE: 既存ECRを使いたい場合。基本的には新規で作るので開発用途。
    if (imported) {
      this.repository = Repository.fromRepositoryName(
        this,
        "repository",
        repositoryName
      );

      return;
    }

    this.repository = new Repository(this, "repository", {
      repositoryName,
      imageScanOnPush: true,
      imageTagMutability: TagMutability.IMMUTABLE,
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }
}
