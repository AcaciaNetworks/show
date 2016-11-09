/**
 * Created by zhaosc on 8/12/16.
 */
let common = require('../../common')
let co = require('co')

var isTarget = "00FF";
var targetMap = {};

exports.onScan = function (data) {
    if (data.name.match('P10-B')) return
    if (!(data.adData || data.scanData).match(isTarget)) return
    if (isConnecting) return
    isConnecting = true
    console.log('mached weight')
    let deviceMac = data.bdaddrs[0].bdaddr
    co(function* () {
        targetMap[deviceMac] = true
        yield common.connect(deviceMac)

        yield common.writeByHandle(deviceMac, '11', '0100')
        yield common.writeByHandle(deviceMac, '13', '55aa7a0f0a0a9d')
    })
};

exports.onNotify = function (data) {
    if (!targetMap[data.id]) return
    //todo: ecg notify analysis
    let hex = data.value.slice(12, 14) + data.value.slice(10, 12);
    var weight = parseInt(hex, 16) / 10;
    console.log('weight:', weight);

    process.send({
        type: 'event',
        data: {
            device: 'xindian',
            value: '体重(Weight)：' + weight + ' kg',
            mac: data.id
        }
    })
}