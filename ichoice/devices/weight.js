/**
 * Created by zhaosc on 8/12/16.
 */
let common = require('../../common')
let co = require('co')

var isTarget = "70100D0B145F8CF011BA";
var targetMap = {};

exports.onScan = function (data) {
    if (!(data.adData || data.scanData).match(isTarget)) return
    if (isConnecting) return
    isConnecting = true
    console.log('mached weight')
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
    let hex = data.value.slice(12, 14) + data.value.slice(10, 12);
    var weight = parseInt(hex, 16) / 10;
    console.log('weight:', weight);

    process.send({
        type: 'event',
        data: {
            device: 'weight',
            value: 'Weight：' + weight + ' kg',
            mac: data.id
        }
    })
}