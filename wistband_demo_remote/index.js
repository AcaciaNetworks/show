var http = require("http");
var EventSource = require('eventsource');
var event = require("events");
var dataHandler = require("./wristHandler")();
var emitter = new event();
var request = require('request');
var bodyParser = require('body-parser');
var express = require('express');
var app = express();
var router = express.Router();
//此demo适用于多个hub

//TODO 多个HUB时应该给以下的值建一个HASH表
var scanEs = {};
var notifyEs = {};
var stateEs = {};
var needoAuth = true;
global.headers = {
    Authorization: 'Basic ' + new Buffer('tester:10b83f9a2e823c47', 'ascii').toString('base64')
};

var header1 = {
    Authorization: 'Basic ' + new Buffer('tester:10b83f9a2e823c47', 'ascii').toString('base64')
};
var req1 = request.defaults({
        baseUrl: 'http://api1.cassianetworks.com',
        headers: header1,
        json: true

});

global.connectionDevices={};
var hubMac;

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

app.post('/hub/start', function (req, res) {
    var devices = req.body.device;
    hubMac = req.body.hubMac.split(",");
    console.log("start work",devices,hubMac);
    dataHandler.startWork(devices);

    oAuth(function(){

        for(let i in hubMac) {
            startScan(hubMac[i], function () {
                startNotify(hubMac[i]);
                startCheck(hubMac[i]);
            });
        }
    });

    res.status(200).send("OK");
});

app.get('/data', function (req, res) {
    var data = dataHandler.alldata();
    res.status(200).send(data);
});

app.get('/start', function (req, res) {
    var deviceId = req.query.mac;
    console.log("start count");
    dataHandler.startCount(deviceId);
    res.status(200).send("OK");
});

//app.get('/', function (req, res,next) {
//    console.log("!!!!!!!!!!!",req);
//    next();
//});

var server = app.listen(4000, function () {
    var port = server.address().port;
    console.log('hub listening at:', port);
});

app.use('/', express.static(__dirname + '/static'));

setInterval(function () {
    oAuth(function(){

    });
    console.log("&&&&&&&&&&&&&&&&&&&&&&&&");
}, 1800000);

function startScan(hub,fn){
    console.log("开始扫描!")
    if(scanEs[hub]){
        scanEs[hub].close();
        delete scanEs[hub];
        console.log("重新扫描!")
    }
        fn();
        var access_token = headers.Authorization.replace("Bearer ", "");
        var es = new EventSource(`http://api1.cassianetworks.com/gap/nodes/?event=1&mac=${hub}&access_token=${access_token}`);
        es.mac = hub;
        scanEs[hub] = es;
        es.on('message', function (e) {
            //console.log(e.data,es.mac);
            dataHandler.handleScanData(e.data,es.mac);
            //console.log(e.data);
        });
        es.on('error', function (e) {
            console.log("scan 错误!!!!!!!!!!!!!!!!!!!!!!!:", e,es.mac);
            scanEs[es.mac].close();
            delete scanEs[es.mac];
            //startScan(es.mac,function(){
            //
            //});
        });
}

function startCheck(hub){
    if(stateEs[hub]){
        stateEs[hub].close();
        delete stateEs[hub];
        console.log("重新监听!");
    }
    var access_token = headers.Authorization.replace("Bearer ", "");
    var es = new EventSource('http://api1.cassianetworks.com/management/nodes/connection-state/?&mac='+hub+'&access_token=' + access_token);
    es.mac = hub;
    stateEs[hub] = es;
    es.on('message', function (e) {
        dataHandler.handleConnectionStateData(e.data,es.mac);
    });
    es.on('error', function (e) {
        //TODO 错误处理机制
        console.log("监听状态 错误!!!!!!!!!!!!!!!!!!!!!!!!:",e,es.mac);
        stateEs[es.mac].close();
        delete stateEs[es.mac];
        //startCheck(es.mac)
    });
}
function startNotify(hub){
    if(notifyEs[hub]){
        notifyEs[hub].close();
        delete  notifyEs[hub];
        console.log("重新notify!");
    }
    var access_token = headers.Authorization.replace("Bearer ", "");
    var es = new EventSource('http://api1.cassianetworks.com/gatt/nodes/?event=1&mac='+hub+'&access_token='+access_token);
        es.mac = hub;
        notifyEs[hub] = es;
        es.on('message', function (e) {
            dataHandler.handleNotifyData(e.data,es.mac);
        });
        es.on('error', function (e) {
            //TODO 错误处理机制
            console.log("notify 错误!!!!!!!!!!!!!!!!!!!!!!!!:", e,es.mac);
            notifyEs[es.mac].close();
            delete  notifyEs[es.mac];
            //startNotify(es.mac);
        });
}

function oAuth(fn) {

    if(true){
    req1.post('/oauth2/token', {
        body: {grant_type: 'client_credentials'}
    }, function (err, res, body) {

        if (err) {
            console.log("err:", err);
        } else {
            needoAuth = false;
            headers.Authorization = 'Bearer ' + body.access_token
            console.log("access_token:" ,body.access_token);
            console.log("headers:", headers);

            fn();
        }
    })
    }else{
        fn();
    }

}
process.on('uncaughtException', (err) => {
    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", err);
});
