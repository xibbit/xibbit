set PKG=test
cd C:\Ampps\www\xibbit\test\server\go
set GOBIN=C:\Ampps\www\xibbit\test\server\go\bin
set GOPATH=C:\Ampps\www\xibbit\test\server\go;C:\Ampps\www\xibbit\server\go;%USERPROFILE%\go
del bin\%PKG%.exe
go fmt %PKG%
cd src/%PKG%
go build ./...
cd ..\..
go install %PKG%
bin\%PKG%
