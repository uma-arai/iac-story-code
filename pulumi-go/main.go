package main

import (
	"pulumi-go/configs"
	"pulumi-go/pkg/module"
	"pulumi-go/pkg/types"

	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) (err error) {
		cfg := configs.NewConfig(ctx)
		plm := types.Pulumi{
			Ctx: ctx,
			Cfg: &cfg,
		}

		infra := &module.Infrastructure{
			Plm: plm,
		}
		if err = infra.CreateInfrastructure(); err != nil {
			return
		}

		app := &module.Application{
			Plm:   plm,
			Infra: infra,
		}
		if err = app.CreateApplication(); err != nil {
			return
		}

		return
	})
}
