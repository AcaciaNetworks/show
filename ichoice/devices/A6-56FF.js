/**
 * Created by wangRan on 2017/3/6.
 */
let common = require('../../common')
let co = require('co')
var rq = require('request');

var isTarget = "F0FF";
var targetMap = {};
var isConnecting = false;
var timer = false;
exports.onScan = function(data) {
    if (!data.name.match(/^A6-/)) return
    if (isConnecting) return
    isConnecting = true
    console.log('mached A6-56FF')
    let deviceMac = data.bdaddrs[0].bdaddr,
    type = data.bdaddrs[0].bdaddrType
    co(function*() {
        targetMap[deviceMac] = true
        yield common.connect(deviceMac, type)
        yield common.writeByHandle(deviceMac, '23', '0100')
        yield common.writeByHandle(deviceMac, '32', '2502242040ee')
        console.log('loop', new Date())
    })
    timer && clearInterval(timer)
    timer = setInterval(function() {
        co(function*() {
            targetMap[deviceMac] = true
            yield common.connect(deviceMac, 'random')
            yield common.writeByHandle(deviceMac, '23', '0100')
            yield common.writeByHandle(deviceMac, '32', '2502242040ee')
            console.log('loop', new Date())
        })
    }, 10 * 1000)
};

exports.onNotify = function(data) {
    if (!targetMap[data.id]) return
    let deviceMac = data.id
    if (data.value.startsWith('04')) {
        var heartRate = parseInt(data.value.slice(2, 4),16)
        console.log(deviceMac, '心率', heartRate);
        process.send({
            type: 'event',
            data: {
                device: 'shouhuan',
                value: 'A6 bpm:' + heartRate,
                mac: data.id
            },
            postData: [{
                type: 'STEPBLACK',
                value: heartRate,
                mac: deviceMac,
                hub_mac: hubMac,
                timestamp: parseInt(Date.now() / 1000)
            }]
        })
    }
}