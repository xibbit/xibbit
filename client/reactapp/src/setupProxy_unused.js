const proxy = require("http-proxy-middleware")

module.exports = app => {
  const hpm = proxy("/ws", {target: "http://localhost:8000/ws/", destroyUpgrade: false, secure: false, ws: true, changeOrigin: true, logLevel: 'debug'});
  app.use(hpm)
  console.log(app)
//  app.listeningApp.on('upgrade', hpm.upgrade)
}
