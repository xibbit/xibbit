set PKG=publicfigure
cd C:\Ampps\www\xibbit\server\golang
set GOBIN=C:\Ampps\www\xibbit\server\golang\bin
set GOPATH=C:\Ampps\www\xibbit\server\golang;%USERPROFILE%\go
del bin\%PKG%.exe
go fmt %PKG%
cd src/%PKG%
go build ./...
cd ..\..
go install %PKG%
bin\%PKG%
