package handler

import (
	"github.com/labstack/echo/v4"
	"github.com/uma-arai/iac-story-code/app/domain/repository"
	"github.com/uma-arai/iac-story-code/app/interface/database"
	"github.com/uma-arai/iac-story-code/app/usecase"
	"github.com/uma-arai/iac-story-code/app/utils"
	"os"
)

// AppHandler ...
type AppHandler struct {
	Interactor usecase.AppInteractor
}

// NewAppHandler ...
func NewAppHandler(sqlHandler database.SQLHandler) *AppHandler {
	return &AppHandler{
		Interactor: usecase.AppInteractor{
			AppRepository: &repository.AppRepository{
				SQLHandler: sqlHandler,
			},
		},
	}
}

// GetAppInfo ...
func (handler *AppHandler) GetAppInfo() echo.HandlerFunc {

	return func(c echo.Context) (err error) {

		id := c.QueryParam("id")
		if id == "" {
			return c.JSON(400, "Invalid parameter id.")
		}

		resJSON, err := handler.Interactor.GetAppInfo(id)
		if err != nil {
			return utils.GetErrorMassage(c, "en", err)
		}

		return c.JSON(200, resJSON)
	}
}

// GetParamInfo returns value from env.
func (handler *AppHandler) GetParamInfo() echo.HandlerFunc {

	return func(c echo.Context) error {
		return c.JSON(200, os.Getenv("SSM_PARAM_TEST"))
	}
}
