var http = require('http')
var server = http.createServer().listen(process.env.PORT || 8082)
var ecstatic = require('ecstatic')({
	root: process.cwd(),
	handleError: false,
	autoIndex: false,
	gzip: true,
	showDir: false,
	serverHeader: false
})
server.on('request', function (request, response) {
})
server.on('request', ecstatic)
