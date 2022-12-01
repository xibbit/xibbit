#!/bin/sh
#--openssl-legacy-provider is needed for Node.js 17+
export NODE_OPTIONS=--openssl-legacy-provider
npm start
