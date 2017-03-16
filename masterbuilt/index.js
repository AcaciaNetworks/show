var http = require("http");
var emitter = new event();




var express = require('express');
var app = express();
var router = express.Router();


app.use(function (req, res, next) {
    res.append('Access-Control-Allow-Origin', '*');
    res.append('Access-Control-Allow-Headers', 'Content-Type,Accept, Authorization');
    res.append('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
    res.append('Access-Control-Allow-Credentials', true);
    if (req.method == 'OPTIONS') return res.end();
    next();
});



var server = app.listen(9122, function () {
    var port = server.address().port;
    console.log('hub listening at:', port);
});
app.use('/', express.static(__dirname + '/static'));




process.on('uncaughtException', (err) => {
    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", err);
});
