// The MIT License (MIT)
//
// xibbit 2.0.0 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//
// @version 2.0.0
// @copyright xibbit 2.0.0 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
// @license http://opensource.org/licenses/MIT
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"database/sql"
	_ "github.com/go-sql-driver/mysql"

	"github.com/gin-gonic/gin"
	socketio "github.com/googollee/go-socket.io"

	"github.com/xibbit/xibbit/server/golang/src/publicfigure/config"
	"github.com/xibbit/xibbit/server/golang/src/publicfigure/events"
	"github.com/xibbit/xibbit/server/golang/src/publicfigure/pfapp"
	"github.com/xibbit/xibbit/server/golang/src/xibbit"
	"github.com/xibbit/xibbit/server/golang/src/xibdb"
)

func main() {
	ginServer := gin.New() //gin.Default()

	socketioServer := socketio.NewServer(nil)

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

	xdb.DumpSql = false
	xdb.DryRun = false

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

	hub.On("api", "__clock", events.E__clock)
	hub.On("api", "__receive", events.E__receive)
	hub.On("api", "__send", events.E__send)
	hub.On("api", "_instance", events.E_instance)
	hub.On("api", "init", events.Init)
	hub.On("api", "login", events.Login)
	hub.On("on", "logout", events.Logout)
	hub.On("api", "user_create", events.User_create)
	hub.On("on", "user_profile_mail_update", events.User_profile_mail_update)
	hub.On("on", "user_profile_upload_photo", events.User_profile_upload_photo)
	hub.On("on", "user_profile", events.User_profile)

	// start the _events system
	hub.Start("")

	socketioHandler := gin.WrapH(socketioServer)

	// serve the client folder and ignore their url_config.js and socket.io versions
	clientFolders := map[string]string{
		"node":      "./src/publicfigure",
		"react":     "../../client/reactapp/build",
		"angularjs": "../../client/angularjs/app",
		"inferno":   "../../client/infernoapp/build",
		"marko":     "../../client/marko/dist",
		"mithril":   "../../client/mithril/dist",
	}
	clientFolder := clientFolders["angularjs"]
	ginServer.Any("/*filepath", func(context *gin.Context) {
		filepath := context.Param("filepath")
		if filepath == "/url_config.js" {
			context.FileFromFS("url_config.js", http.Dir("./static"))
		} else if strings.HasPrefix(filepath, "/socket.io.js.map") {
			context.FileFromFS("socketio/socket.io.js.map", http.Dir("./static"))
		} else if strings.HasPrefix(filepath, "/socketio/socket.io.js") {
			context.FileFromFS("socketio/socket.io.js", http.Dir("./static"))
		} else if strings.HasPrefix(filepath, "/user/profile/upload_photo") {
			file, header, err := context.Request.FormFile("user_profile_upload_photo_image")
			if err != nil {
				context.String(http.StatusBadRequest, fmt.Sprintf("file err : %s", err.Error()))
				return
			}
			// show how to get sid but do nothing with it
			sid := context.PostForm("sid")
			sid = sid
			instance := context.PostForm("instance")
			session := hub.GetSessionByInstance(instance)
			// get upload filename from user's browser
			filename := header.Filename
			eventReply, _ := hub.Trigger(map[string]interface{}{
				"type": "user_profile_upload_photo",
				"image": map[string]interface{}{
					"filename": filename,
					"tmp_name": file,
				},
				"_session": session["session_data"],
			})
			delete(eventReply, "_session")
			eventsReplyBytes, _ := json.Marshal([]map[string]interface{}{eventReply})
			context.String(http.StatusOK, string(eventsReplyBytes))
		} else if strings.HasPrefix(filepath, "/socket.io/") {
			socketioHandler(context)
		} else if _, err := os.Stat(clientFolder + filepath); err == nil {
			context.FileFromFS(filepath[1:], http.Dir(clientFolder))
		} else if strings.HasPrefix(filepath, "/public/") {
			context.FileFromFS(filepath[1:], http.Dir("."))
		} else {
			context.FileFromFS(filepath[1:], http.Dir("./static"))
		}
	})

	// start server
	log.Printf("public figure server started on port %d...", APP_PORT)
	go socketioServer.Serve()
	defer socketioServer.Close()
	ginServer.Run()
}
