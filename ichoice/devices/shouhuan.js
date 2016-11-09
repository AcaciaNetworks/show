/**
 * Created by zhaosc on 8/12/16.
 */
var request = require('../libs/request');
var model = require('../model');
var rq = require('request');

var isTarget = "100D0B145F8CF011BA";
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
            //console.log('sssssssssssshhhhhhhhhhh', data);
            if (data.value.startsWith('55aa06')) {
                var pairstring = handleData(data.value, mac);
                writeByHandler(mac, 18, pairstring);
            }
            if (data.value.slice(0, 6).toLowerCase() == "55aa05") {
                var step = handleStep(data.value);
                if (!step) return;
                console.log("步数::::", step);
                rq({
                    json: true,
                    method: 'POST',
                    form: {
                        type: 'STEP',
                        value: step,
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
                    type: 'shouhuan',
                    mac: mac,
                    value: '步数(step)：' + step,
                    time: Date.now()
                })
            }
        })
    });

    //connectionState
    request({
        method: 'GET',
        path: '/management/nodes/connection-state?mac=' + hubMac
    }).then(function (res) {
        res.on('data', function (state) {
            if (!targetMap[state.handle]) return;
            console.log(state);
            var isConnecting = state.connectionState == 'connected' || state.connectionState == 'connect'
            if (!isConnecting) {
                console.log(state);
                connected[state.handle] = false;
            }
        })
    });
};

exports.onScan = function (data) {
    dataObj = JSON.parse(data);
    if (dataObj.name.match('A40')) {
        console.log('matched');
        connect(data)
    }
};

function connect(info) {
    info = info.split('\n\n')[0];
    info = info.replace('data: ', '');
    try {
        info = JSON.parse(info);
    } catch (e) {
        console.log(e, info)
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
        console.log('connect', ret, deviceMac);
        isConnecting = false;
        //xt,xy
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
                return writeByHandler(deviceMac, '18', 'AA5502B0B2')
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

var p1 = 43;//秘钥生成素数1
var p2 = 47;//秘钥生成素数2
var k = 31;//公钥
function handleData(data) {

    var a = data.slice(8, 10);
    var b = data.slice(10, 12);
    var c = data.slice(12, 14);
    var d = data.slice(14, 16);
    console.log(a, b, c, d);
    return getCodes(parseInt('0x' + a), parseInt('0x' + b), parseInt('0x' + c), parseInt('0x' + d));

}

function getCodes(a, b, c, d) {
    var code1 = (b << 8) + a;
    var code2 = (d << 8) + c;
    console.log(code1, code2);

    // var reaData = getD;
    // console.log("密钥",reaData);
    var d1 = decrData(code1);
    var d2 = decrData(code2);


    var paircode = (d2 << 8) + d1;
    paircode = ('0000' + paircode.toString()).slice(-4, 10);

    var jiaoyan = judgeSum("04B1" + paircode);
    var pairstring = "AA5504B1" + paircode + jiaoyan;


    console.log("最终结果::", pairstring);
    return pairstring;
}

function judgeSum(string) {

    var a = '0x' + string.slice(0, 2);
    var b = '0x' + string.slice(2, 4);
    var c = '0x' + string.slice(4, 6);
    var d = '0x' + string.slice(6, 8);

    var e = parseInt(a) + parseInt(b) + parseInt(c) + parseInt(d);
    var result = e.toString(16);
    if (result.length == 1) {
        result = '0' + result;
    } else {

        result = result[result.length - 2] + result[result.length - 1];
    }
    ;
    return result;


}
function getD() {

    var d = 0;
    var e;
    e = (p1 - 1) * (p2 - 1);
    while (!(k * (++d) % e == 1));
    return d;
}

function candp(mc, d, t) {


    var r = 1;
    d = d + 1;
    while (d != 1) {
        r = r * mc;
        r = r % t;
        d--;
    }
    return r;

}

function decrData(data) {

    return candp(data, k, p1 * p2);

}


function handleStep(stepData) {
    var a = '0x' + stepData.slice(6, 8);
    var b = '0x' + stepData.slice(8, 10);
    var c = '0x' + stepData.slice(10, 12);
    var d = '0x' + stepData.slice(12, 14);

    var step = parseInt(a) + parseInt(b) * 256 + parseInt(c) * 256 * 256 + parseInt(d) * 256 * 256 * 256;
    return step;
}

