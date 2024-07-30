module publicfigure/pwd

go 1.22.5

replace github.com/xibbit/xibbit/server/golang/src/publicfigure/config v0.0.0 => ../config

require (
	github.com/xibbit/xibbit/server/golang/src/publicfigure/config v0.0.0
	golang.org/x/crypto v0.25.0
)
