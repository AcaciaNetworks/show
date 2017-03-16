var http = require("http");
var EventSource = require('eventsource');
var event = require("events");
var emitter = new event();

var bodyParser = require('body-parser');



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
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({extended: true})); // for parsing application/x-www-form-urlencoded




var server = app.listen(9122, function () {
    var port = server.address().port;
    console.log('hub listening at:', port);
});
app.use('/', express.static(__dirname + '/static'));




process.on('uncaughtException', (err) => {
    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", err);
});
