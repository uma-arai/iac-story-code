package infrastructure

import (
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/uma-arai/iac-story-code/app/handler"
)

// Router ...
func Router() *echo.Echo {
	e := echo.New()

	// Middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	basePath := "cnis"

	AppHandler := handler.NewAppHandler(NewSQLHandler())
	healthCheckHandler := handler.NewHealthCheckHandler()
	helloWorldHandler := handler.NewHelloWorldHandler()

	e.GET("/healthcheck", healthCheckHandler.HealthCheck())
	e.GET(basePath+"/v1/helloworld", helloWorldHandler.SayHelloWorld())
	e.GET(basePath+"/v1/app", AppHandler.GetAppInfo())
	e.GET(basePath+"/v1/param", AppHandler.GetParamInfo())
	return e
}
