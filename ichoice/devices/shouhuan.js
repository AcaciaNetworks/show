/**
 * Created by zhaosc on 8/12/16.
 */
let common = require('../../common')
let co = require('co')
var rq = require('request');

var isTarget = "100D0B145F8CF011BA";
var targetMap = {};

exports.onScan = function (data) {
    if (!data.name.match('A40')) return
    if (isConnecting) return
    isConnecting = true
    console.log('matched A40');
    let deviceMac = data.bdaddrs[0].bdaddr
    co(function* () {
        targetMap[deviceMac] = true
        yield common.connect(deviceMac)

        yield common.writeByHandle(deviceMac, '22', '0100')
        yield common.writeByHandle(deviceMac, '25', '0100')
        yield common.writeByHandle(deviceMac, '28', '0100')
        yield common.writeByHandle(deviceMac, '31', '0100')
        yield common.writeByHandle(deviceMac, '18', 'AA5502B0B2')
    })
}

exports.onNotify = function (data) {
    if (!targetMap[data.id]) return
    var mac = data.id;
    //console.log('sssssssssssshhhhhhhhhhh', data);
    if (data.value.startsWith('55aa06')) {
        var pairstring = handleData(data.value, mac);
        common.writeByHandler(mac, 18, pairstring);
    }
    if (data.value.slice(0, 6).toLowerCase() == "55aa05") {
        var step = handleStep(data.value);
        if (!step) return;
        console.log("步数::::", step);
        // rq({
        //     json: true,
        //     method: 'POST',
        //     form: {
        //         type: 'STEP',
        //         value: step,
        //         mac: mac,
        //         hub_mac: hubMac,
        //         timestamp: parseInt(Date.now() / 1000)
        //     },
        //     url: 'http://www.cooptec.cn/ShangYiJia/getWearableDevice.action'
        // }, function (err, res, body) {
        //     console.log('post to shangYiJia sys OK!!!!!!!!', body);
        //     console.log(err, res.statusCode);
        // });
        process.send({
            type: 'event',
            data: {
                device: 'shouhuan',
                value: 'step:' + step,
                mac: data.id
            }
        })
    }
}

var p1 = 43;//秘钥生成素数1
var p2 = 47;//秘钥生成素数2
var k = 31;//公钥
function handleData(data) {

    var a = data.slice(8, 10);
    var b = data.slice(10, 12);
    var c = data.slice(12, 14);
    var d = data.slice(14, 16);
    console.log(a, b, c, d);
    return getCodes(parseInt('0x' + a), parseInt('0x' + b), parseInt('0x' + c), parseInt('0x' + d));

}

function getCodes(a, b, c, d) {
    var code1 = (b << 8) + a;
    var code2 = (d << 8) + c;
    console.log(code1, code2);

    // var reaData = getD;
    // console.log("密钥",reaData);
    var d1 = decrData(code1);
    var d2 = decrData(code2);


    var paircode = (d2 << 8) + d1;
    paircode = ('0000' + paircode.toString()).slice(-4, 10);

    var jiaoyan = judgeSum("04B1" + paircode);
    var pairstring = "AA5504B1" + paircode + jiaoyan;


    console.log("最终结果::", pairstring);
    return pairstring;
}

function judgeSum(string) {

    var a = '0x' + string.slice(0, 2);
    var b = '0x' + string.slice(2, 4);
    var c = '0x' + string.slice(4, 6);
    var d = '0x' + string.slice(6, 8);

    var e = parseInt(a) + parseInt(b) + parseInt(c) + parseInt(d);
    var result = e.toString(16);
    if (result.length == 1) {
        result = '0' + result;
    } else {

        result = result[result.length - 2] + result[result.length - 1];
    }
    return result;


}
function getD() {

    var d = 0;
    var e;
    e = (p1 - 1) * (p2 - 1);
    while (!(k * (++d) % e == 1));
    return d;
}

function candp(mc, d, t) {


    var r = 1;
    d = d + 1;
    while (d != 1) {
        r = r * mc;
        r = r % t;
        d--;
    }
    return r;

}

function decrData(data) {

    return candp(data, k, p1 * p2);

}


function handleStep(stepData) {
    var a = '0x' + stepData.slice(6, 8);
    var b = '0x' + stepData.slice(8, 10);
    var c = '0x' + stepData.slice(10, 12);
    var d = '0x' + stepData.slice(12, 14);

    var step = parseInt(a) + parseInt(b) * 256 + parseInt(c) * 256 * 256 + parseInt(d) * 256 * 256 * 256;
    return step;
}

