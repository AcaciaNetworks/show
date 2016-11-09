/**
 * Created by zhaosc on 8/24/16.
 */
let common = require('../../common')
let co = require('co')
var rq = require('request');

var isTarget = "AET-WD-";
var targetMap = {};
var connected = {}

exports.onScan = function (data) {
    if (!(data.adData || data.scanData).match(isTarget)) return
    if (isConnecting) return
    isConnecting = true
    console.log('kouwen matched');
    let deviceMac = data.bdaddrs[0].bdaddr
    co(function* () {
        targetMap[deviceMac] = true
        yield common.connect(deviceMac)

        yield common.writeByHandle(deviceMac, '15', '0100')
    })
}

exports.onNotify = function (data) {
    if (!targetMap[data.id]) return
    var mac = data.id;
    console.log(data.value, 'kkkkkk');
    var kw = parseInt(data.value.slice(8, 12), 16);
    console.log(kw, 'kkkkkk');
    kw = kw / 100;
    console.log('kouwen', kw);
    //rq({
    //    json: true,
    //    method: 'POST',
    //    form: {
    //        type: 'TEMP',
    //        value: kw,
    //        mac: mac,
    //        hub_mac: hubMac,
    //        timestamp: parseInt(Date.now() / 1000)
    //    },
    //    url: 'http://www.cooptec.cn/ShangYiJia/getWearableDevice.action'
    //}, function (err, res, body) {
    //    console.log('post to shangYiJia sys OK!!!!!!!!', body);
    //    console.log(err, res.statusCode);
    //});
    process.send({
        type: 'event',
        data: {
            device: 'temp',
            value: '口温(Oral Temperature)：' + kw,
            mac: data.id
        }
    })
}