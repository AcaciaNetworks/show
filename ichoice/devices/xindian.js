/**
 * Created by zhaosc on 8/12/16.
 */
let common = require('../../common')
let co = require('co')
var rq = require('request');

var isTarget = "0010";
var targetMap = {};

var t1 = t2 = 0;


exports.DEVICE_NAME = 'A12-B';


function reverseUUID(v) {
    return String(v).replace(/-/g, '').toUpperCase().split('').reverse().join('')
}

function get_verify_sum(t) {
    t = String(t).replace('55aa', '');
    while (t.length < 6) {
        t = t + '0';
    }
    var p1, p2, p3, v;
    p1 = parseInt(t.substr(t.length - 6, 2), 16);
    p2 = parseInt(t.substr(t.length - 4, 2), 16);
    p3 = parseInt(t.substr(t.length - 2, 2), 16);
    v = ((p1 + p2 + p3) % 256).toString(16);
    return (v.length == 1) ? ('0' + v) : v;
}

function calc_verify_sum(t) {
    var subfix = get_verify_sum(t);
    return t + subfix;
}

exports.onScan = function (data) {
    if (!data.match('A12-B')) return
    if (isConnecting) return
    isConnecting = true
    console.log('xindian mached');
    let deviceMac = data.bdaddrs[0].bdaddr
    co(function* () {
        targetMap[deviceMac] = true
        yield common.connect(deviceMac)

        yield common.writeByHandle(deviceMac, '34', '0100')
        yield common.writeByHandle(deviceMac, '37', '0100')
        yield common.writeByHandle(deviceMac, '40', '0100')
        yield common.writeByHandle(deviceMac, '43', '0100')
        yield common.writeByHandle(deviceMac, '46', '0100')
        yield common.writeByHandle(deviceMac, '49', '0100')
        yield common.writeByHandle(deviceMac, '52', '0100')
    })
};
let lastData
exports.onNotify = function (data) {
    if (!targetMap[data.id]) return
    var deviceMac = data.id;
    console.log(6666666666, data.value);
    if (data.value == lastData) return;
    lastData = data.value;
    buffer += data.value;

    co(function *() {
        if (data.value.match('55aa0d0d')) {//buffer.match('55aa0d0d')){
            console.log('feedback 55aa0d0d');
            t1 && clearTimeout(t1);
            t1 = setTimeout(function () {
                yield common.writeByHandler(deviceMac, writeHandle, calc_verify_sum('55aa00'));
                buffer = '';
                console.log('delay 500ms and send 55aa0000');
                t1 && clearTimeout(t1);
            }, 500)
        }

        if (data.value.match('55aa0000')) {//buffer.match('55aa0000')){
            console.log('--------------------------------------');
            t2 && clearTimeout(t2);
            t2 = setTimeout(function () {
                yield common.writeByHandler(deviceMac, writeHandle, calc_verify_sum('55aa03'));
                buffer = '';
                console.log('send 55aa0303');
                t2 && clearTimeout(t2);
            }, 1000)
        }

        if (buffer.match('55aa03') && buffer.match('4544')) {
            var i = buffer.indexOf('55aa03');
            lastIndex = buffer.substr(i + 8, i + 2);
            console.log(i, lastIndex, 88888)
            yield common.writeByHandler(deviceMac, writeHandle, calc_verify_sum('55aa04' + lastIndex));
            buffer = '';
            console.log('send ', '55aa04' + lastIndex)
        }

        var hrReg = /^55aa04.*4544$/;
        //if (buffer.match('55aa04') && buffer.match('4544')) {
        if (buffer.match(hrReg)) {

            var r = buffer.substr(24, 2),
                hr_h = parseInt(buffer.substr(20, 2), 16),
                hr_l = parseInt(buffer.substr(18, 2), 16),
                hr = ((hr_h & 0xff) << 8) + (hr_l & 0xff);

            var err_code = buffer.substr(28, 2);
            console.log('结果', r, '心率', hr, 'err', err_code, buffer);
            var retStr = '心率(Hr)：' + hr + '结果(result)：' + (r == '00' ? '正常(usual)' : '异常(unusual)');

            model.save({
                type: 'xindian',
                mac: deviceMac,
                value: retStr,
                time: Date.now()
            });

            console.log('55aa05' + lastIndex, 99999);
            yield common.writeByHandler(deviceMac, writeHandle, calc_verify_sum('55aa05' + lastIndex));
            buffer = '';

            console.log('send ', '55aa05' + lastIndex)
        }

        if (buffer.match('55aa05') && buffer.match('4544')) {
            console.log('------------------BUFFER-LEN', buffer.length);
            if (buffer.length == 15042) {
                //console.log('FINAL_DATA:', buffer.substr(6, 15036));
                //var now = new Date();
                //var nowStr = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate() + ' ' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();
                //rq({
                //    json: true,
                //    method: 'POST',
                //    form: {
                //        type: 'XD',
                //        value: buffer,
                //        mac: deviceMac,
                //        hub_mac: hubMac,
                //        timestamp: parseInt(Date.now() / 1000)
                //    },
                //    url: 'http://www.cooptec.cn/ShangYiJia/getWearableDevice.action'
                //}, function (err, res, body) {
                //    console.log('post to shangYiJia sys OK!!!!!!!!', body);
                //    console.log(err, res.statusCode);
                //});
                //rq({
                //    json: true,
                //    method: 'POST',
                //    form: {
                //        devicetype: 3,
                //        method: 'addrecord',
                //        sn: '22222222',
                //        did: 107,
                //        recorddate: nowStr,
                //        nowtime: nowStr,
                //        ecgdata: buffer,
                //        checktype: 0,
                //        uc: 'MTAwIzEwMCM0Mjk3ZjQ0YjEzOTU1MjM1MjQ1YjI0OTczOTlkN2E5Mw=='
                //    },
                //    url: 'http://115.29.164.236:8071/Services/ServiceHandler.ashx'
                //}, function (err, res, body) {
                //    console.log('post to rendering sys OK!!!!!!!!', body)
                //    console.log(err, res.statusCode);
                //    //model.save({
                //    //    type: 'xindian',
                //    //    mac: deviceMac,
                //    //    time: Date.now(),
                //    //    value: ''
                //    //})
                //});
                buffer = '';
            }
        }
    })

}
