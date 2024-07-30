module test

go 1.22.5

replace github.com/xibbit/xibbit/server/golang/src/xibbit v0.0.0 => ../../../../../server/golang/src/xibbit

replace github.com/xibbit/xibbit/server/golang/src/xibdb v0.0.0 => ../../../../../server/golang/src/xibdb

require (
	github.com/go-sql-driver/mysql v1.8.1
	github.com/googollee/go-socket.io v1.7.0
	github.com/xibbit/xibbit/server/golang/src/xibbit v0.0.0
	github.com/xibbit/xibbit/server/golang/src/xibdb v0.0.0
)

require (
	filippo.io/edwards25519 v1.1.0 // indirect
	github.com/gofrs/uuid v4.0.0+incompatible // indirect
	github.com/gomodule/redigo v1.8.4 // indirect
	github.com/gorilla/websocket v1.4.2 // indirect
)
