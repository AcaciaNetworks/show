/**
 * Created by zhaosc on 8/12/16.
 */

var request = require('./libs/request');
global.hubMac = 'CC:1B:E0:E0:28:1C';
//global.hubMac = 'CC:1B:E0:E0:0E:30';
var needRestart = false;

var devicesToConnect = [];
devicesToConnect.push(require('./devices/xtxy'));
devicesToConnect.push(require('./devices/shouhuan'));
devicesToConnect.push(require('./devices/xindian'));
devicesToConnect.push(require('./devices/xueya'));
devicesToConnect.push(require('./devices/xuetang'));
devicesToConnect.push(require('./devices/kouwen'));

//fallIndicator
devicesToConnect.push(require('./devices/fall'));

global.isConnecting = false;


request.auth().then(function () {

    devicesToConnect.forEach(function (m) {
        m.onAuth();
    });
    //scan
    request({
        method: 'GET',
        path: '/gap/nodes?event=1&mac=' + hubMac
    }).then(function (res) {
        res.on('data', function (data) {
            data = JSON.stringify(data);
            devicesToConnect.forEach(function (m) {
                m.onScan(data);
            });
        })
    });
});


process.on('unhandledRejection', function (reason, p) {
    if (reason.match && reason.match('offline')) {
        needRestart = true;
    }
    console.log(reason);
    isConnecting = false;
});


var model = require('./model');
var express = require('express');
var app = express();

app.get('/ichoice/data', function (req, res) {
    res.send(model.get());
    //if (needRestart) process.exit();
});

app.get('/ichoice/token', function (req, res) {
    //model.clear();
    model.clear('begin');
    request.auth()
        .then(function () {
            return request({
                method: 'GET',
                path: '/cassia/hubs/' + hubMac
            });
        })
        .then(function (ret) {
            if (ret.match('offline')) {
                res.end('offline');
                process.exit()
            }
            console.log(ret, 'refresh');
            res.end();
            if (needRestart) {
                process.exit()
            }
        })
        .catch(function (e) {
            res.send(e);
            process.exit()
        })
});

app.use('/ichoice', express.static(__dirname + '/static'));

app.listen(9999);

//check hub is online
setInterval(function () {
    request({
        method: 'GET',
        path: '/cassia/hubs/' + hubMac
    })
        .then(function (ret) {
            if (ret.match('offline')) {
                needRestart = true;
            }
        })
        .catch(function (e) {
            console.log('interval', e)
        })
}, 5000);
