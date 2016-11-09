/**
 * Created by zhaosc on 9/20/16.
 */
let common = require('../libs/common');
let ihealth = require('../libs/ihealthCloud');
let deviceProtocol = 'com.jiuan.BWSV01';
let serviceUUID = common.toUUID(deviceProtocol);
let deviceType = 'A6';

let characterUUID = common.toUUID('rtx.jiuan.BWSV01', true);
let macs = {};

let writeHandler;
let getting = false;
function getWriteHandler(deviceMac) {
    if (getting) return;
    getting = true;

    //get characteristics
    req.get(`/gatt/nodes/${deviceMac}/characteristics?uuid=${characterUUID}`, function (err, res, body) {
        getting = false;
        console.log(deviceMac, 'characteristics', body, res.statusCode);
        //if (res.statusCode != 200) return getWriteHandler(deviceMac);
        writeHandler = body.characteristics[0].handle;
    });
}

exports.onScan = function HS4OnScan(data) {
    if (data.adData && common.getUUID(data.adData) == serviceUUID) {
        let deviceMac = data.bdaddrs[0].bdaddr;
        if (isConnecting) return;
        console.log('HS4', data);
        isConnecting = true;
        console.log('connect HS4', deviceMac);
        common.connect(deviceMac, deviceType, deviceProtocol)
            .then(function () {
                macs[deviceMac] = true;

                getWriteHandler(deviceMac);

            }).catch(function (e) {
                console.error('connect error')
            });
    }
};

exports.onNotify = function HS4OnNotify(data) {
    if (!macs[data.id]) return;
    if (!writeHandler) {
        getWriteHandler(data.id);
        return setTimeout(HS4OnNotify, 100, data);
    }
    console.log('HS4 notify', data);
    if (data.value == deviceType + 'C1') {
        common.writeByHandle(data.id, writeHandler, deviceType + 'C100' + common.getTime());
    }
    if (data.value.startsWith(deviceType + '40')) {
        let weight = processData(data.value);
        console.log('==================================');
        console.log('weight', weight);

        common.writeByHandle(data.id, writeHandler, deviceType + '4000');
        ihealth.saveWeight(data.id, weight);
        process.send({
            type: 'event',
            data: {
                device: 'weight',
                value: `${weight} Kg`,
                mac: data.id
            }
        })
    }
};

function processData(value) {
    let tmp1 = value.slice(22, 24);
    let tmp2 = value.slice(24, 26);
    let ret = parseInt(tmp1, 16) * 256 + parseInt(tmp2, 16);
    return ret/10;
}
//processData('A640010107FE09150D0330017300000000000000');
