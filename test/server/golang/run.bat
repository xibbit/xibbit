set PKG=test
cd C:\Ampps\www\xibbit\test\server\golang
set GOBIN=C:\Ampps\www\xibbit\test\server\golang\bin
set GOPATH=C:\Ampps\www\xibbit\test\server\golang;C:\Ampps\www\xibbit\server\golang;%USERPROFILE%\go
del bin\%PKG%.exe
cd src/%PKG%
go fmt
go install
cd ..\..
bin\%PKG%
