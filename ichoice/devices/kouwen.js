/**
 * Created by zhaosc on 8/24/16.
 */
var request = require('../libs/request');
var model = require('../model');
var rq = require('request');

var isTarget = "AET-WD-";
var targetMap = {};
var connected = {};
exports.onAuth = function () {
    //listen data
    request({
        method: 'GET',
        path: '/gatt/nodes?event=1&mac=' + hubMac
    }).then(function (res) {
        res.on('data', function (data) {
            var mac = data.id;
            var targets = Object.keys(targetMap);
            var isTarget = false;
            targets.forEach(function (t) {
                if (mac == t) {
                    isTarget = true;
                }
            });
            if (!isTarget) return;
            console.log(data.value, 'kkkkkk');
            var kw = parseInt(data.value.slice(8, 12), 16);
            console.log(kw, 'kkkkkk');
            kw = kw / 100;
            console.log('kouwen', kw);
            rq({
                json: true,
                method: 'POST',
                form: {
                    type: 'TEMP',
                    value: kw,
                    mac: mac,
                    hub_mac: hubMac,
                    timestamp: parseInt(Date.now() / 1000)
                },
                url: 'http://www.cooptec.cn/ShangYiJia/getWearableDevice.action'
            }, function (err, res, body) {
                console.log('post to shangYiJia sys OK!!!!!!!!', body);
                console.log(err, res.statusCode);
            });
            model.save({
                type: 'kouwen',
                mac: mac,
                value: '口温(Oral Temperature)：' + kw,
                time: Date.now()
            });
        })
    });
};

exports.onScan = function (data) {
    if (data.match(isTarget)) {
        console.log('kouwen matched');
        connect(data)
    }
};
function connect(info) {
    info = info.replace('data: ', '');
    try {
        info = JSON.parse(info);
    } catch (e) {
    }
    var deviceMac = info.bdaddrs[0].bdaddr;
    targetMap[deviceMac] = true;
    if (isConnecting) return;
    isConnecting = true;
    request({
        method: 'POST',
        path: '/gap/nodes/' + deviceMac + '/connection?chip=0&mac=' + hubMac,
        body: {
            timeOut: '1',
            type: 'public'
        }
    }).then(function (ret) {
        console.log('connect', ret);
        isConnecting = false;

        writeByHandler(deviceMac, '15', '0100')
    })
}