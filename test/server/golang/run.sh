#!/bin/sh
PKG=test
export GOBIN=/Applications/AMPPS/www/xibbit/test/server/golang/bin/
export GOPATH=/Applications/AMPPS/www/xibbit/test/server/golang:/Applications/AMPPS/www/xibbit/server/golang:~/go
rm bin/$PKG
cd src/$PKG
go fmt
go install
cd ../..
bin/$PKG
