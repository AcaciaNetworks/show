/**
 * Created by zhaosc on 8/12/16.
 */
let common = require('../../common')
let co = require('co')
var rq = require('request');

var isTarget = "F0FF";
var targetMap = {};
exports.onScan = function (data) {
    if (!data.name.match('Bluetooth BP')) return
    if (isConnecting) return
    isConnecting = true
    console.log('mached xueya')
    let deviceMac = data.bdaddrs[0].bdaddr
    co(function* () {
        targetMap[deviceMac] = true
        yield common.connect(deviceMac)

        yield common.writeByHandle(deviceMac, '99', '0100')
        yield common.writeByHandle(deviceMac, '101', 'FDFDFA050D0A')
    })
};

exports.onNotify = function (data) {
    if (!targetMap[data.id]) return
    let deviceMac = data.id
    if (data.value.startsWith('fdfdfc')) {
        var gy = parseInt(data.value.slice(6, 8), 16);
        var dy = parseInt(data.value.slice(8, 10), 16);
        var mb = parseInt(data.value.slice(10, 12), 16);
        console.log(deviceMac, '高压：', gy, '低压', dy, '脉搏', mb);
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
            url: 'http://www.syrjia.com/ShangYiJia/getWearableDevice.action'
        }, function (err, res, body) {
            console.log('post to shangYiJia sys OK!!!!!!!!', body);
            console.log(err, res.statusCode);
        });
    process.send({
        type: 'event',
        data: {
            device: 'xueya',
            value: '高压(SBP ):' + gy + '低压(DBP):' + dy + '脉搏(hr):' + mb,
            mac: data.id
        }
    })
}}