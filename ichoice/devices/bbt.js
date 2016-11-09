/**
 * Created by zhaosc on 8/12/16.
 */
let common = require('../../common')
let co = require('co')

var isTarget = "D0100D0B145F8CF011BA";
var targetMap = {};

exports.onScan = function (data) {
    if (!(data.adData || data.scanData).match(isTarget)) return
    if (isConnecting) return;
    isConnecting = true
    console.log('mached bbt')
    let deviceMac = data.bdaddrs[0].bdaddr
    co(function* () {
        targetMap[deviceMac] = true
        yield common.connect(deviceMac)

        yield common.writeByHandle(deviceMac, '29', '0100')
        yield common.writeByHandle(deviceMac, '32', '0100')
        yield common.writeByHandle(deviceMac, '35', '0100')
        yield common.writeByHandle(deviceMac, '38', '0100')
        yield common.writeByHandle(deviceMac, '25', 'aa5509c2100a0a0110101020')
        yield common.writeByHandle(deviceMac, '25', 'aa5502b2b4')
    })
};

exports.onNotify = function (data) {
    if (!targetMap[data.id]) return
    let hex = data.value.slice(8, 12);
    var temp = parseInt(hex, 16) / 100;
    console.log('temp:', temp);

    process.send({
        type: 'event',
        data: {
            device: 'temp',
            value: '体温(Thermometer)：' + temp,
            mac: data.id
        }
    })
}