/**
 * Created by zhaosc on 8/12/16.
 */
let common = require('../../common')
let co = require('co')

var isTarget = "A0100D0B145F8CF011BA";
var targetMap = {};

exports.onScan = function (data) {
    if (!(data.adData || data.scanData).match(isTarget)) return
    if (isConnecting) return
    isConnecting = true
    console.log(hubMac, 'mached bp')
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
    var high = parseInt(data.value.slice(12, 14) + data.value.slice(10, 12), 16);
    var low = parseInt(data.value.slice(16, 18) + data.value.slice(14, 16), 16);
    var heartRate = parseInt(data.value.slice(20, 22) + data.value.slice(18, 20), 16);
    console.log(hubMac, 'bp:', high, low, heartRate);
    if (high == 180 && isNaN(low) && isNaN(heartRate)) return

    process.send({
        type: 'event',
        data: {
            device: 'xueya',
            value: 'High Blood Pressure: ' + high + ' SYS mmHg</br>' + 'Low Blood Pressure: ' + low + ' DIA mmHg</br>' + 'Heartbeat: ' + heartRate + ' Pul/min',
            mac: data.id
        },
        postData: [{
        type: 'BP',
        value: high + ':' + low + ':' + heartRate,
        mac: data.id,
        hub_mac: hubMac,
        timestamp: parseInt(Date.now() / 1000)
    }]
    })
}