import { Construct, RemovalPolicy } from "@aws-cdk/core";
import { IRepository, Repository, TagMutability } from "@aws-cdk/aws-ecr";

interface IContainerRepositoryProps {
  name?: string; // 省略時はidを使用
  imported?: boolean; // 開発用途。基本的にはfalse
}

export class ContainerRepository extends Construct {
  readonly repository: IRepository;

  constructor(scope: Construct, id: string, props: IContainerRepositoryProps) {
    super(scope, id);

    const { name, imported } = props;
    const repositoryName = name || id;

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
