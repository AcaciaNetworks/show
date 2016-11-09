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
        console.log('characteristics', body, res.statusCode);
        //if (res.statusCode != 200) return getWriteHandler(deviceMac);
        writeHandler = body.characteristics[0].handle;
    });
}

exports.onScan = function BPOnScan(data) {
    if (data.adData && common.getUUID(data.adData) == serviceUUID) {
        let deviceMac = data.bdaddrs[0].bdaddr;
        //if (deviceMac != '7C:EC:79:3D:FE:45') return;

        if (isConnecting) return;
        console.log('BP', data, isConnecting);

        isConnecting = true;
        console.log('connect BP', deviceMac);
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
    console.log('bp notify', data);
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
        console.log('xueya', sbp, dbp, hr);
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

    //read data;
};

//let bpData = 'A140010010091511391A44420000';//88/61/69
//let dbp = bpData.slice(20, 22);
//dbp = parseInt(dbp, 16);
//let sbp = bpData.slice(18, 20);
//sbp = parseInt(sbp, 16) + dbp;
//let hr = bpData.slice(22, 24);
//hr = parseInt(hr, 16);
//console.log(sbp, dbp, hr);

/*
 attr handle: 0x0001, end grp handle: 0x000b uuid: 00001800-0000-1000-8000-00805f9b34fb
 attr handle: 0x000c, end grp handle: 0x000f uuid: 00001801-0000-1000-8000-00805f9b34fb
 attr handle: 0x0010, end grp handle: 0x0015 uuid: 636f6d2e-6a69-7561-6e2e-425041563130
 attr handle: 0x0016, end grp handle: 0xffff uuid: 0000180a-0000-1000-8000-00805f9b34fb


 handle: 0x0002, char properties: 0x02, char value handle: 0x0003, uuid: 00002a00-0000-1000-8000-00805f9b34fb
 handle: 0x0004, char properties: 0x02, char value handle: 0x0005, uuid: 00002a01-0000-1000-8000-00805f9b34fb
 handle: 0x0006, char properties: 0x0a, char value handle: 0x0007, uuid: 00002a02-0000-1000-8000-00805f9b34fb
 handle: 0x0008, char properties: 0x08, char value handle: 0x0009, uuid: 00002a03-0000-1000-8000-00805f9b34fb
 handle: 0x000a, char properties: 0x02, char value handle: 0x000b, uuid: 00002a04-0000-1000-8000-00805f9b34fb
 handle: 0x000d, char properties: 0x20, char value handle: 0x000e, uuid: 00002a05-0000-1000-8000-00805f9b34fb
 handle: 0x0011, char properties: 0x10, char value handle: 0x0012, uuid: 7365642e-6a69-7561-6e2e-425041563130
 handle: 0x0014, char properties: 0x0c, char value handle: 0x0015, uuid: 7265632e-6a69-7561-6e2e-425041563130
 handle: 0x0017, char properties: 0x02, char value handle: 0x0018, uuid: 00002a23-0000-1000-8000-00805f9b34fb
 handle: 0x0019, char properties: 0x02, char value handle: 0x001a, uuid: 00002a24-0000-1000-8000-00805f9b34fb
 handle: 0x001b, char properties: 0x02, char value handle: 0x001c, uuid: 00002a25-0000-1000-8000-00805f9b34fb
 handle: 0x001d, char properties: 0x02, char value handle: 0x001e, uuid: 00002a26-0000-1000-8000-00805f9b34fb
 handle: 0x001f, char properties: 0x02, char value handle: 0x0020, uuid: 00002a27-0000-1000-8000-00805f9b34fb
 handle: 0x0021, char properties: 0x02, char value handle: 0x0022, uuid: 00002a28-0000-1000-8000-00805f9b34fb
 handle: 0x0023, char properties: 0x02, char value handle: 0x0024, uuid: 00002a29-0000-1000-8000-00805f9b34fb
 handle: 0x0025, char properties: 0x02, char value handle: 0x0026, uuid: 00002a2a-0000-1000-8000-00805f9b34fb
 handle: 0x0027, char properties: 0x02, char value handle: 0x0028, uuid: 00002a50-0000-1000-8000-00805f9b34fb
 handle: 0x0029, char properties: 0x02, char value handle: 0x002a, uuid: 0000ff01-0000-1000-8000-00805f9b34fb
 handle: 0x002b, char properties: 0x02, char value handle: 0x002c, uuid: 0000ff02-0000-1000-8000-00805f9b34fb





 handle: 0x0001, uuid: 00002800-0000-1000-8000-00805f9b34fb
 handle: 0x0002, uuid: 00002803-0000-1000-8000-00805f9b34fb
 handle: 0x0003, uuid: 00002a00-0000-1000-8000-00805f9b34fb
 handle: 0x0004, uuid: 00002803-0000-1000-8000-00805f9b34fb
 handle: 0x0005, uuid: 00002a01-0000-1000-8000-00805f9b34fb
 handle: 0x0006, uuid: 00002803-0000-1000-8000-00805f9b34fb
 handle: 0x0007, uuid: 00002a02-0000-1000-8000-00805f9b34fb
 handle: 0x0008, uuid: 00002803-0000-1000-8000-00805f9b34fb
 handle: 0x0009, uuid: 00002a03-0000-1000-8000-00805f9b34fb
 handle: 0x000a, uuid: 00002803-0000-1000-8000-00805f9b34fb
 handle: 0x000b, uuid: 00002a04-0000-1000-8000-00805f9b34fb
 handle: 0x000c, uuid: 00002800-0000-1000-8000-00805f9b34fb
 handle: 0x000d, uuid: 00002803-0000-1000-8000-00805f9b34fb
 handle: 0x000e, uuid: 00002a05-0000-1000-8000-00805f9b34fb
 handle: 0x000f, uuid: 00002902-0000-1000-8000-00805f9b34fb
 handle: 0x0010, uuid: 00002800-0000-1000-8000-00805f9b34fb
 handle: 0x0011, uuid: 00002803-0000-1000-8000-00805f9b34fb
 handle: 0x0012, uuid: 7365642e-6a69-7561-6e2e-425041563130
 handle: 0x0013, uuid: 00002902-0000-1000-8000-00805f9b34fb
 handle: 0x0014, uuid: 00002803-0000-1000-8000-00805f9b34fb
 handle: 0x0015, uuid: 7265632e-6a69-7561-6e2e-425041563130
 handle: 0x0016, uuid: 00002800-0000-1000-8000-00805f9b34fb
 handle: 0x0017, uuid: 00002803-0000-1000-8000-00805f9b34fb
 handle: 0x0018, uuid: 00002a23-0000-1000-8000-00805f9b34fb
 handle: 0x0019, uuid: 00002803-0000-1000-8000-00805f9b34fb
 handle: 0x001a, uuid: 00002a24-0000-1000-8000-00805f9b34fb
 handle: 0x001b, uuid: 00002803-0000-1000-8000-00805f9b34fb
 handle: 0x001c, uuid: 00002a25-0000-1000-8000-00805f9b34fb
 handle: 0x001d, uuid: 00002803-0000-1000-8000-00805f9b34fb
 handle: 0x001e, uuid: 00002a26-0000-1000-8000-00805f9b34fb
 handle: 0x001f, uuid: 00002803-0000-1000-8000-00805f9b34fb
 handle: 0x0020, uuid: 00002a27-0000-1000-8000-00805f9b34fb
 handle: 0x0021, uuid: 00002803-0000-1000-8000-00805f9b34fb
 handle: 0x0022, uuid: 00002a28-0000-1000-8000-00805f9b34fb
 handle: 0x0023, uuid: 00002803-0000-1000-8000-00805f9b34fb
 handle: 0x0024, uuid: 00002a29-0000-1000-8000-00805f9b34fb
 handle: 0x0025, uuid: 00002803-0000-1000-8000-00805f9b34fb
 handle: 0x0026, uuid: 00002a2a-0000-1000-8000-00805f9b34fb
 handle: 0x0027, uuid: 00002803-0000-1000-8000-00805f9b34fb
 handle: 0x0028, uuid: 00002a50-0000-1000-8000-00805f9b34fb
 handle: 0x0029, uuid: 00002803-0000-1000-8000-00805f9b34fb
 handle: 0x002a, uuid: 0000ff01-0000-1000-8000-00805f9b34fb
 handle: 0x002b, uuid: 00002803-0000-1000-8000-00805f9b34fb
 handle: 0x002c, uuid: 0000ff02-0000-1000-8000-00805f9b34fb

 */