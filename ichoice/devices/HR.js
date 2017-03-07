/**
 * Created by zhaosc on 8/12/16.
 */
let common = require('../../common')
let co = require('co')
var rq = require('request');

var isTarget = "F0FF";
var targetMap = {};
exports.onScan = function (data) {
    if (!data.name.match(/^HR\s#/)) return
    if (isConnecting) return
    isConnecting = true
    console.log('mached HR #')
    let deviceMac = data.bdaddrs[0].bdaddr,
    type = data.bdaddrs[0].bdaddrType
    co(function* () {
        targetMap[deviceMac] = true
        yield common.connect(deviceMac,type)
        yield common.writeByHandle(deviceMac, '24', '0100')
    })
};

exports.onNotify = function (data) {
    if (!targetMap[data.id]) return
    let deviceMac = data.id
    if (data.value.startsWith('04')) {
        var heartRate = parseInt(data.value.slice(2, 4),16)
        console.log(deviceMac, '心率', heartRate);
        process.send({
            type: 'event',
            data: {
                device: 'shouhuan',
                value: 'HR心率:' + heartRate,
                mac: data.id
            },
            postData: [{
                type: 'STEPNEW',
                value: heartRate,
                mac: deviceMac,
                hub_mac: hubMac,
                timestamp: parseInt(Date.now() / 1000)
            }]
        })
    }
}