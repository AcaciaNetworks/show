/**
 * Created by zhaosc on 9/20/16.
 */
let common = require('../libs/common');
let ihealth = require('../libs/ihealthCloud');
let deviceProtocol = 'com.jiuan.POV11';
let serviceUUID = common.toUUID(deviceProtocol) + '00';
let deviceType = 'AC';
let characterUUID = common.toUUID('rtx.jiuan.POV11', true) + '00';

let macs = {};

let writeHandler;
let getting = false;
function getWriteHandler(deviceMac) {
    if (getting) return;
    getting = true;

    //get characteristics
    req.get(`/gatt/nodes/${deviceMac}/characteristics?uuid=${characterUUID}`, function (err, res, body) {
        getting = false;
        console.log(hubMac, deviceMac, 'characteristics', body, res && res.statusCode);
        //if (res.statusCode != 200) return getWriteHandler(deviceMac);
        writeHandler = body.characteristics[0].handle;
    });
}

exports.onScan = function PO3OnScan(data) {
    if (data.adData && common.getUUID(data.adData) == serviceUUID) {
        let deviceMac = data.bdaddrs[0].bdaddr;
        if (isConnecting) return;
        console.log(hubMac, 'PO3', data);
        isConnecting = true;
        console.log(hubMac, 'connect PO3', deviceMac);
        common.connect(deviceMac, deviceType, deviceProtocol)
            .then(function () {
                macs[deviceMac] = true;
                getWriteHandler(deviceMac);
            }).catch(function (e) {
                if (e == 'busy') return;
                console.error('connect error', e)
            });
    }
};

exports.onNotify = function BPOnNotify(data) {
    if (!macs[data.id]) return;
    if (!writeHandler) {
        getWriteHandler(data.id);
        return setTimeout(BPOnNotify, 100, data);
    }
    console.log(hubMac, 'po3 notify', data);
    if (data.value == deviceType + 'C1') {
        common.writeByHandle(data.id, writeHandler, deviceType + 'C100' + common.getTime());
    }
    if (data.value.startsWith(deviceType + '40')) {
        let xy = processData(data.value);
        console.log('==================================');
        console.log(hubMac, 'xueyang', xy);

        common.writeByHandle(data.id, writeHandler, deviceType + '4000');
        ihealth.saveXueYang(data.id, xy.xueYang, xy.hr);
        process.send({
            type: 'event',
            data: {
                device: 'xueyang',
                value: `血氧：${xy.xueYang}, 心率：${xy.hr}`,
                mac: data.id
            }
        })
    }
};

function processData(value) {
    let xueYang = value.slice(18, 20);
    xueYang = parseInt(xueYang, 16);
    let hr = value.slice(20, 22);
    hr = parseInt(hr, 16);
    return {xueYang, hr};
}
