/**
 * Created by zhaosc on 9/18/16.
 */
var request = require('../libs/request');
var model = require('../model');
var bluetooth = require('../libs/bluetooth');

var isTarget = "CassiaFD_";
var fallInfo = {
    'CC:1B:E0:E8:01:FD': {
        name: '梁钒',
        count: 0
    },
    'CC:1B:E0:E8:00:9A': {
        name: '老龚',
        count: 0
    }
};
var fallList = Object.keys(fallInfo);
var targetMap = {};
var connected = {};
exports.onAuth = function () {
};

exports.onScan = function (data) {

    var info = JSON.parse(data);
    var deviceMac = info.bdaddrs[0].bdaddr;
    if (fallList.indexOf(deviceMac) > -1 && info.adData) {
        var packet = info.adData;
        //03 fall
        //04 press
        var count = packet.slice(24, 26);
        var type = packet.slice(28, 30);
        type = parseInt(type, 16);
        var battery = packet.slice(30);
        battery = parseInt(battery, 16);
        var theFall = fallInfo[deviceMac];
        if(theFall.count == 0) {
            //initial
            theFall.count = count;
        }

        //user press fall
        if (parseInt(count, 16) > parseInt(theFall.count, 16)) {
            theFall.count = count;
            model.clear();
            model.save({
                type: 'begin',
                mac: deviceMac,
                time: Date.now(),
                value: theFall.name + '开始测量(start check)'
            });
            console.log(theFall.name, '开始测量', ':count:', count)
        }
    }

};
function connect(info) {
    info = info.replace('data: ', '');
    try {
        info = JSON.parse(info);
    } catch (e) {
    }
    var deviceMac = info.bdaddrs[0].bdaddr;
    targetMap[deviceMac] = true;
    if (isConnecting) return;
    isConnecting = true;
    request({
        method: 'POST',
        path: '/gap/nodes/' + deviceMac + '/connection?chip=0&mac=' + hubMac,
        body: {
            timeOut: '1',
            type: 'public'
        }
    }).then(function (ret) {
        console.log('connect', ret);
        isConnecting = false;

        bluetooth.writeByHandler(deviceMac, '15', '0100')
    })
}

