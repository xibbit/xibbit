///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
const HttpProxy = require('http-proxy');
const proxy = new HttpProxy();

proxy.on('error', function(err, req, res) {
  res.writeHead(500, {
    'Content-Type': 'text/plain'
  });
  res.end('http-proxy sent an error event');
});

require("./project").server({
  httpPort: process.env.PORT || 8080, // Optional, but added here for demo purposes
  middleware: {
    init: function(rest) {
      rest.addRoute({
        method: 'GET',
        path: '/php/**',
        logRequests: true
      });
      rest.addRoute({
        method: 'POST',
        path: '/php/**',
        logRequests: true
      });
      rest.addRoute({
        method: 'GET',
        path: '/socket.io/**',
        logRequests: true
      });
    },
    handler: function(rest) {
      if (rest.route.path === '/php/**') {
        proxy.web(rest.req, rest.res, {
          target: 'http://localhost/xibbit/server/'
        });
      } else if (rest.route.path === '/socket.io/**') {
          proxy.web(rest.req, rest.res, {
            target: 'http://localhost/xibbit/server/php/'
          });
      } else {
        rest.next();
      }
    }
  }
});
