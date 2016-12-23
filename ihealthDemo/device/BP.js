/**
 * Created by zhaosc on 9/20/16.
 */
let common = require('../libs/common');
let ihealth = require('../libs/ihealthCloud');
let deviceProtocol = 'com.jiuan.BPAV10';
let serviceUUID = common.toUUID(deviceProtocol);
let deviceType = 'A1';

let characterUUID = common.toUUID('rec.jiuan.BPAV10', true);
let macs = {};

let writeHandler;
let getting = false;
function getWriteHandler(deviceMac) {
    if(getting) return;
    getting = true;

    //get characteristics
    req.get(`/gatt/nodes/${deviceMac}/characteristics?uuid=${characterUUID}`, function (err, res, body) {
        getting = false;
        console.log(hubMac, deviceMac, 'characteristics', body, res.statusCode);
        //if (res.statusCode != 200) return getWriteHandler(deviceMac);
        writeHandler = body.characteristics[0].handle;
    });
}

exports.onScan = function BPOnScan(data) {
    if (data.adData && common.getUUID(data.adData) == serviceUUID) {
        let deviceMac = data.bdaddrs[0].bdaddr;
        //if (deviceMac != '7C:EC:79:3D:FE:45') return;

        if (isConnecting) return;
        console.log(hubMac, 'BP', data, isConnecting);

        isConnecting = true;
        console.log(hubMac, 'connect BP', deviceMac);
        common.connect(deviceMac, deviceType, deviceProtocol)
            .then(function () {
                macs[deviceMac] = true;

                getWriteHandler(deviceMac);

                ////get all
                //req.get(`/gatt/nodes/${deviceMac}/services/characteristics/descriptors?`, function (err, res, body) {
                //    console.log('all....', body, res.statusCode);
                //});

                //function onRead(ret) {
                //    console.log(common.hexToString(ret.value))
                //}
                //
                //common.readByHandle(deviceMac, '0x001a')
                //    .then(onRead)
                //    .then(()=> {
                //        return common.readByHandle(deviceMac, '0x0024')
                //    })
                //    .then(onRead)
                //    .then(()=> {
                //        return common.readByHandle(deviceMac, '0x002a')
                //    })
                //    .then(onRead)
                //    .then(()=> {
                //        return common.readByHandle(deviceMac, '0x002c')
                //    })
                //    .then(onRead)

            }).catch(function (e) {
                console.error(hubMac, 'connect error', e, deviceMac)
            });
    }
};

exports.onNotify = function BPOnNotify(data) {
    if (!macs[data.id]) return;
    if (!writeHandler) {
        getWriteHandler(data.id);
        return setTimeout(BPOnNotify, 100, data);
    }
    console.log(hubMac, 'bp notify', data);
    if (data.value == deviceType + 'C1') {
        common.writeByHandle(data.id, writeHandler, deviceType + 'C100' + common.getTime());
    }
    if (data.value.startsWith('A140')) {
        let bpData = data.value;
        let dbp = bpData.slice(20, 22);
        dbp = parseInt(dbp, 16);
        let sbp = bpData.slice(18, 20);
        sbp = parseInt(sbp, 16) + dbp;
        let hr = bpData.slice(22, 24);
        hr = parseInt(hr, 16);
        console.log(hubMac, 'xueya', sbp, dbp, hr);
        ihealth.saveBP(data.id, sbp, dbp, hr);
        common.writeByHandle(data.id, writeHandler, deviceType + '4000');
        process.send({
            type: 'event',
            data: {
                device: 'xueya',
                value: `SBP:${sbp}, DBP:${dbp}, Hr:${hr}`,
                mac: data.id
            }
        })
    }
};