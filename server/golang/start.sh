#!/bin/sh
PKG=publicfigure
export GOBIN=/Applications/AMPPS/www/xibbit/server/golang/bin/
export GOPATH=/Applications/AMPPS/www/xibbit/server/golang:~/go
rm bin/$PKG
cd src/$PKG
go fmt
go install
cd ../..
bin/$PKG
