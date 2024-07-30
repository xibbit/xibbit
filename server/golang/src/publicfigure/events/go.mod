module publicfigure/events

go 1.22.5

replace github.com/xibbit/xibbit/server/golang/src/publicfigure/array v0.0.0 => ../array

replace github.com/xibbit/xibbit/server/golang/src/publicfigure/asserte v0.0.0 => ../asserte

replace github.com/xibbit/xibbit/server/golang/src/publicfigure/config v0.0.0 => ../config

replace github.com/xibbit/xibbit/server/golang/src/publicfigure/pfapp v0.0.0 => ../pfapp

replace github.com/xibbit/xibbit/server/golang/src/publicfigure/pwd v0.0.0 => ../pwd

replace github.com/xibbit/xibbit/server/golang/src/xibbit v0.0.0 => ../../xibbit

replace github.com/xibbit/xibbit/server/golang/src/xibdb v0.0.0 => ../../xibdb

require (
	github.com/xibbit/xibbit/server/golang/src/publicfigure/array v0.0.0
	github.com/xibbit/xibbit/server/golang/src/publicfigure/asserte v0.0.0
	github.com/xibbit/xibbit/server/golang/src/publicfigure/pfapp v0.0.0
	github.com/xibbit/xibbit/server/golang/src/publicfigure/pwd v0.0.0
	github.com/xibbit/xibbit/server/golang/src/xibbit v0.0.0
)

require (
	github.com/gofrs/uuid v4.0.0+incompatible // indirect
	github.com/gomodule/redigo v1.8.4 // indirect
	github.com/googollee/go-socket.io v1.7.0 // indirect
	github.com/gorilla/websocket v1.4.2 // indirect
	github.com/xibbit/xibbit/server/golang/src/publicfigure/config v0.0.0 // indirect
	github.com/xibbit/xibbit/server/golang/src/xibdb v0.0.0 // indirect
	golang.org/x/crypto v0.25.0 // indirect
)
