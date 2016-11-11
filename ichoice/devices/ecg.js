/**
 * Created by zhaosc on 8/12/16.
 */
let common = require('../../common')
let co = require('co')

var isTarget = "00FF";
var targetMap = {};

exports.onScan = function (data) {
    //console.log('ecg', data)
    if (!data.name.match('P10-B')) return
    if (!(data.adData || data.scanData).match(isTarget)) return
    if (isConnecting) return
    isConnecting = true
    console.log('mached ecg', data)
    let deviceMac = data.bdaddrs[0].bdaddr
    co(function* () {
        targetMap[deviceMac] = true
        yield common.connect(deviceMac)

        yield common.writeByHandle(deviceMac, '11', '0100')
        yield common.writeByHandle(deviceMac, '13', '55aa6114000075', true)
    })
};

exports.onNotify = function (data) {
    if (!targetMap[data.id]) return
    console.log('ecg notify', data)
    //todo: ecg notify analysis
    if(data.value.slice(4,6)!="61") return;
    let hex = data.value.slice(30,32);
    var heartRate = parseInt(hex, 16);
    console.log('heartRate:', heartRate);

    process.send({
        type: 'event',
        data: {
            device: 'ecg',
            value: 'ECG:' + heartRate,
            mac: data.id
        }
    })
}