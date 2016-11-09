/**
 * Created by zhaosc on 8/12/16.
 */
var request = require('../libs/request');
var model = require('../model');
var rq = require('request');

var isTarget = "0010";
var connected = {};

exports.onAuth = function () {
    //connectionState
    request({
        method: 'GET',
        path: '/management/nodes/connection-state?mac=' + hubMac
    }).then(function (res) {
        res.on('data', function (state) {
            console.log(state, 'xuetang', connected);
            var isConnecting = state.connectionState == 'connected' || state.connectionState == 'connect'
            if (connected[state.handle]) {
                connected[state.handle] = isConnecting
            }
        })
    });
};

exports.onScan = function (data) {
    if (data.match('Bioland-BGM')) {
        connect(data)
    }
};

function connect(info) {
    info = info.replace('data: ', '');
    info = JSON.parse(info);
    var deviceMac = info.bdaddrs[0].bdaddr;
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
        //listen data
        request({
            method: 'GET',
            path: '/gatt/nodes?event=1&mac=' + hubMac
        }).then(function (res) {
            res.on('data', function (data) {
                if (data.id !== deviceMac) return;
                console.log(data.value, '血糖origin');

                var v0 = data.value.slice(0, 2);
                var v2 = data.value.slice(4, 6);

                var v10 = parseInt(data.value.slice(20, 22), 16);
                var v9 = parseInt(data.value.slice(18, 20), 16);
                var xy = ((v10 & 0xff) << 8) + (v9 & 0xff);
                xy = xy / 18;
                xy = xy.toFixed(2);
                console.log(v0, v2, data.value.length);
                if (data.value.length == 28 && v0 == '55' && v2 == '03') {
                    console.log(deviceMac, '血糖：', xy);
                    rq({
                        json: true,
                        method: 'POST',
                        form: {
                            type: 'BG',
                            value: xy,
                            mac: deviceMac,
                            hub_mac: hubMac,
                            timestamp: parseInt(Date.now() / 1000)
                        },
                        url: 'http://www.cooptec.cn/ShangYiJia/getWearableDevice.action'
                    }, function (err, res, body) {
                        console.log('post to shangYiJia sys OK!!!!!!!!', body);
                        console.log(err, res.statusCode);
                    });
                    model.save({
                        type: 'xuetang',
                        mac: deviceMac,
                        value: '血糖(Blood Glucose)：' + xy,
                        time: Date.now()
                    });
                    connected[deviceMac] = false;
                    res.destroy()
                } else {
                    console.log('again 18');
                    //要数据
                    writeByHandler(deviceMac, '18', '5A0B050E0B080C12A90000')
                }

            });
        });
        setTimeout(function () {
            writeByHandler(deviceMac, '22', '0100')
                .then(function () {
                    return writeByHandler(deviceMac, '18', '5A0B050E0B080C12A90000')
                })
        }, 500)
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
            //if (ret != 'OK') {
            //return arguments.callee.apply(null, arguments)
            //}
        })
        .catch(function (e) {
            console.log(e);
            //return arguments.callee.apply(null, arguments)
        })
}
