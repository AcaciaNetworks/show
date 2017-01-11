/**
 * Created by zhaosc on 8/12/16.
 */
let common = require('../../common')
let co = require('co')
var rq = require('request');

var isTarget = "80100D0B145F8CF011BA";
var targetMap = {};

exports.onScan = function (data) {
    if (!(data.adData || data.scanData).match(isTarget)) return
    if (isConnecting) return;
    isConnecting = true
    console.log('mached xueyang')
    let deviceMac = data.bdaddrs[0].bdaddr
    co(function* () {
        targetMap[deviceMac] = true
        yield common.connect(deviceMac)

        yield common.writeByHandle(deviceMac, '22', '0100')
        yield common.writeByHandle(deviceMac, '25', '0100')
        yield common.writeByHandle(deviceMac, '28', '0100')
        yield common.writeByHandle(deviceMac, '31', '0100')
        yield common.writeByHandle(deviceMac, '18', 'AA5504B10000B5')
    })
};

exports.onNotify = function (data) {
    if (!targetMap[data.id]) return
    let mac = data.id
    var bo = parseInt(data.value.slice(-6, -4), 16);
    var hr = parseInt(data.value.slice(-4, -2), 16);
    console.log(hr, '-----------');
    if (hr != 0) {
        console.log(data.id, {
            bo: bo,
            hr: hr
        });
        process.send({
            type: 'event',
            data: {
                device: 'xueyang',
                value: 'Pulse Oximeter:' + bo + 'HR:' + hr,
                mac: data.id
            },
            postData: [{
                type: 'HR',
                value: hr,
                mac: mac,
                hub_mac: hubMac,
                timestamp: parseInt(Date.now() / 1000)
            }, {
                type: 'BO',
                value: bo,
                mac: mac,
                hub_mac: hubMac,
                timestamp: parseInt(Date.now() / 1000)
            }]
        })
    }
}