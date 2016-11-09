/**
 * Created by zhaosc on 9/18/16.
 */
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
exports.onScan = function (info) {
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
            process.send({
                type: 'event',
                data: {
                    device: 'begin',
                    value: theFall.name + '开始测量(start check)',
                    mac: data.id
                }
            })
            console.log(theFall.name, '开始测量', ':count:', count)
        }
    }

};

exports.onNotify = function() {

}

