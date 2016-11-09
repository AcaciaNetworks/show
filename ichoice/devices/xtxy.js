/**
 * Created by zhaosc on 8/12/16.
 */
var request = require('../libs/request');
var model = require('../model');
var rq = require('request');

var isTarget = "80100D0B145F8CF011BA";
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
                if(mac == t) {
                    isTarget = true;
                }
            });
            if (!isTarget) return;
            var xy = parseInt(data.value.slice(-6, -4), 16);
            var xt = parseInt(data.value.slice(-4, -2), 16);
            console.log(xt, '-----------');
            if (xt != 0) {
                console.log(mac, {
                    xy: xy,
                    xt: xt
                });
                rq({
                    json: true,
                    method: 'POST',
                    form: {
                        type: 'BO',
                        value: xy,
                        mac: mac,
                        hub_mac: hubMac,
                        timestamp: parseInt(Date.now() / 1000)
                    },
                    url: 'http://www.cooptec.cn/ShangYiJia/getWearableDevice.action'
                }, function (err, res, body) {
                    console.log('post to shangYiJia sys OK!!!!!!!!', body);
                    console.log(err, res.statusCode);
                });
                rq({
                    json: true,
                    method: 'POST',
                    form: {
                        type: 'HR',
                        value: xt,
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
                    type: 'xueyang',
                    mac: mac,
                    value: '血氧(Blood Oxygen)：' + xy + '心跳(hr)：' + xt,
                    time: Date.now()
                });
            }
        })
    });
};

exports.onScan = function (data) {
    if (data.match(isTarget)) {
        console.log('xueyang matched');
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
    if(isConnecting) return;
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

        writeByHandler(deviceMac, '22', '0100')
            .then(function () {
                return writeByHandler(deviceMac, '25', '0100')
            })
            .then(function () {
                return writeByHandler(deviceMac, '28', '0100')
            })
            .then(function () {
                return writeByHandler(deviceMac, '31', '0100')
            })
            .then(function () {
                return writeByHandler(deviceMac, '18', 'AA5504B10000B5')
            })
    })
}

function writeByHandler(deviceMac, handle, value) {
    return new Promise(function (resolve, reject) {
        request({
            method: 'GET',
            path: '/gatt/nodes/' + deviceMac + '/handle/' + handle + '/value/' + value + '?mac=' + hubMac
        })
            .then(function (ret) {
                resolve(ret)
            })
            .catch(function (e) {
                reject(e)
            })
    })
        .then(function (ret) {
            console.log('write handle', ret);
        })
        .catch(function (e) {
            console.log(e);
        })
}