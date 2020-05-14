///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
package main

import (
	"log"
	"net/http"
	"strings"

	"database/sql"
	_ "github.com/go-sql-driver/mysql"

	"github.com/gin-gonic/gin"
	socketio "github.com/googollee/go-socket.io"

	"publicfigure/config"
	"publicfigure/events"
	"publicfigure/pfapp"
	"xibbit"
	"xibdb"
)

func main() {
	ginServer := gin.New() //gin.Default()

	socketioServer, e := socketio.NewServer(nil)
	if e != nil {
		log.Fatal(e)
	}

	const APP_HOST = "localhost"
	const APP_PORT = 8000

	// connect to the MySQL database
	const host string = "127.0.0.1"
	const spec string = config.Sql_user + ":" + config.Sql_pass + "@tcp(" + host + ":3306)/" + config.Sql_db
	link, e := sql.Open("mysql", spec)
	if e != nil {
		log.Fatal(e)
	}
	// map the MySQL database to arrays and JSON
	xdb := xibdb.NewXibDb(map[string]interface{}{
		"json_column":     "json", // freeform JSON column name
		"sort_column":     "n",    // array index column name
		"link_identifier": link,
	})

	xdb.DumpSql = true

	// Public Figure specific database
	pf := pfapp.NewPfapp(xdb, config.Sql_prefix)

	// create and configure the Xibbit server object
	var hub = xibbit.NewXibbitHub(map[string]interface{}{
		"socketio": socketioServer,
		"mysql": map[string]interface{}{
			"link":       link,
			"SQL_PREFIX": config.Sql_prefix,
		},
		"vars": map[string]interface{}{
			"pf":           pf,
			"useInstances": true,
			"hacks":        config.Hacks,
		},
	})

	hub.Api("__clock", events.E__clock)
	hub.Api("__receive", events.E__receive)
	hub.Api("__send", events.E__send)
	hub.Api("_instance", events.E_instance)
	hub.Api("init", events.Init)
	hub.Api("login", events.Login)
	hub.On("logout", events.Logout)
	hub.Api("user_create", events.User_create)
	hub.On("user_profile_mail_update", events.User_profile_mail_update)
	hub.On("user_profile", events.User_profile)

	// start the _events system
	hub.Start("")

	socketioHandler := gin.WrapH(socketioServer)

	// serve the client folder and ignore their url_config.js and socket.io versions
	clientFolders := map[string]string{
		"node":      "./src/publicfigure",
		"react":     "../../client/reactapp/build",
		"angularjs": "../../client/angularjs/app",
		"inferno":   "../../client/infernoapp/build",
		"mithril":   "../../client/mithril/dist",
	}
	clientFolder := clientFolders["angularjs"]
	ginServer.Any("/*filepath", func(context *gin.Context) {
		filepath := context.Param("filepath")
		if filepath == "/url_config.js" {
			context.FileFromFS("url_config.js", http.Dir("./static"))
		} else if strings.HasPrefix(filepath, "/socket.io/socket.io.js") {
			context.FileFromFS("socket.io/socket.io.js", http.Dir("./static"))
		} else if strings.HasPrefix(filepath, "/socket.io/") {
			socketioHandler(context)
		} else {
			context.FileFromFS(filepath[1:], http.Dir(clientFolder))
		}
	})

	// start server
	log.Printf("public figure server started on port %d...", APP_PORT)
	go socketioServer.Serve()
	defer socketioServer.Close()
	ginServer.Run()
}
