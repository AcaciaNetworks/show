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

        yield common.writeByHandle(deviceMac, '22', '0100')
        yield common.writeByHandle(deviceMac, '25', '0100')
        yield common.writeByHandle(deviceMac, '28', '0100')
        yield common.writeByHandle(deviceMac, '31', '0100')
        yield common.writeByHandle(deviceMac, '18', 'aa5509c2100a0a0110101020')
        yield common.writeByHandle(deviceMac, '18', 'aa5502b2b4')
    })
};

exports.onNotify = function (data) {
    if (!targetMap[data.id]) return;
    if(data.value.slice(6,8) != "bb") return;
    let hex = data.value.slice(8, 12);
    var temp = parseInt(hex, 16) / 100;
    console.log('temp:', temp);

    process.send({
        type: 'event',
        data: {
            device: 'temp',
            value: 'Thermometer:' + temp,
            mac: data.id
        }
    })
}