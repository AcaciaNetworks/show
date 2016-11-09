/**
 * Created by zhaosc on 8/12/16.
 */
var request = require('../libs/request');
var model = require('../model');
var rq = require('request');

var isTarget = "F0FF";
var connected = {};

exports.onAuth = function () {
    //connectionState
    request({
        method: 'GET',
        path: '/management/nodes/connection-state?mac=' + hubMac
    }).then(function (res) {
        res.on('data', function (state) {
            var isConnecting = state.connectionState == 'connected' || state.connectionState == 'connect'
            if (connected[state.handle]) {
                connected[state.handle] = isConnecting
            }
        })
    });
};
exports.onScan = function (data) {
    if (data.match('Bluetooth BP')) {
        connect(data)
    }
};

function connect(info) {
    info = info.replace('data: ', '');
    try {
        info = JSON.parse(info);
    } catch (e) {
        console.log(info);
        return;
    }
    var deviceMac = info.bdaddrs[0].bdaddr;
    if (isConnecting) return;
    isConnecting = true;
    console.log('connect', info);
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
        //listen data
        request({
            method: 'GET',
            path: '/gatt/nodes?event=1&mac=' + hubMac
        }).then(function (res) {
            res.on('data', function (data) {
                if (data.id !== deviceMac) return;
                console.log(data.value);
                if (data.value.startsWith('fdfdfc')) {
                    var gy = parseInt(data.value.slice(6, 8), 16);
                    var dy = parseInt(data.value.slice(8, 10), 16);
                    var mb = parseInt(data.value.slice(10, 12), 16);
                    console.log(deviceMac, '高压：', gy, '低压', dy, '脉搏', mb);
                    model.save({
                        type: 'xueya',
                        mac: deviceMac,
                        value: '高压(SBP ):' + gy + '低压(DBP):' + dy + '脉搏(hr):' + mb,
                        time: Date.now()
                    });
                    rq({
                        json: true,
                        method: 'POST',
                        form: {
                            type: 'BP',
                            value: gy + ':' + dy + ':' + mb,
                            mac: deviceMac,
                            hub_mac: hubMac,
                            timestamp: parseInt(Date.now() / 1000)
                        },
                        url: 'http://www.cooptec.cn/ShangYiJia/getWearableDevice.action'
                    }, function (err, res, body) {
                        console.log('post to shangYiJia sys OK!!!!!!!!', body);
                        console.log(err, res.statusCode);
                    });
                    res.destroy()
                }
            })
        });

        writeByHandler(deviceMac, '99', '0100')
            .then(function () {
                return writeByHandler(deviceMac, '101', 'FDFDFA050D0A')
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
            console.log('write handle', ret, handle, value);
        })
        .catch(function (e) {
            console.log(e);
        })
}