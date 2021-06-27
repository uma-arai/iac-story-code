import { Construct, RemovalPolicy } from "@aws-cdk/core";
import { IRepository, Repository, TagMutability } from "@aws-cdk/aws-ecr";
import constants from "../../../constants";

interface IContainerRepositoryProps {
  imported?: boolean; // 開発用途。基本的にはfalse
}

export class ContainerRepository extends Construct {
  readonly repository: IRepository;

  constructor(scope: Construct, id: string, props: IContainerRepositoryProps) {
    super(scope, id);

    const { imported } = props;
    const repositoryName = `${constants.ServicePrefix}-ecr-app`;

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
