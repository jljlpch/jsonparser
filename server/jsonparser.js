var parser = require('./../index');
var http = require('http');

http.createServer(function (request, response) {
    var headers = request.headers;
    var method = request.method;
    var url = request.url;
    var body = '';
    request.on('error', function (err) {
        console.error(err);
    }).on('data', function (chunk) {
        body += chunk;
    }).on('end', function () {
        var inputBody = JSON.parse(body);
        var result = parser.evaluate(inputBody.input, inputBody.xpath);
        console.log('result is: ' + JSON.stringify(result))
        response.writeHead(200, {"Content-Type": "application/json"});
        response.write(JSON.stringify(result));
        response.end();
    });
}).listen(2004);
