/**
 * Created by zhaosc on 8/12/16.
 */
let common = require('../../common')
let co = require('co')
var rq = require('request');

var isTarget = "0010";
var targetMap = {};

exports.onScan = function (data) {
    if (!data.match('Bioland-BGM')) return
    if (isConnecting) return
    isConnecting = true
    console.log('mached xuetang')
    let deviceMac = data.bdaddrs[0].bdaddr
    co(function* () {
        targetMap[deviceMac] = true
        yield common.connect(deviceMac)

        yield common.writeByHandle(deviceMac, '22', '0100')
        yield common.writeByHandle(deviceMac, '18', '5A0B050E0B080C12A90000')
    })
};

exports.onNotify = function (data) {
    if (!targetMap[data.id]) return
    let deviceMac = data.id
    console.log(data.value, '血糖origin');
    var v0 = data.value.slice(0, 2);
    var v2 = data.value.slice(4, 6);
    var v10 = parseInt(data.value.slice(20, 22), 16);
    var v9 = parseInt(data.value.slice(18, 20), 16);
    var xy = ((v10 & 0xff) << 8) + (v9 & 0xff);
    xy = xy / 18;
    xy = xy.toFixed(2);
    console.log(v0, v2, data.value.length);
    if (data.value.length == 28 && v0 == '55' && v2 == '03') {
        console.log(deviceMac, '血糖：', xy);
        //rq({
        //    json: true,
        //    method: 'POST',
        //    form: {
        //        type: 'BG',
        //        value: xy,
        //        mac: deviceMac,
        //        hub_mac: hubMac,
        //        timestamp: parseInt(Date.now() / 1000)
        //    },
        //    url: 'http://www.cooptec.cn/ShangYiJia/getWearableDevice.action'
        //}, function (err, res, body) {
        //    console.log('post to shangYiJia sys OK!!!!!!!!', body);
        //    console.log(err, res.statusCode);
        //});
        process.send({
            type: 'event',
            data: {
                device: 'xuetang',
                value: '血糖(Blood Glucose)：' + xy,
                mac: data.id
            }
        })
    } else {
        console.log('again 18');
        //要数据
        common.writeByHandler(deviceMac, '18', '5A0B050E0B080C12A90000')
    }
}