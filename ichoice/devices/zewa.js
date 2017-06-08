/**
 * Created by zhaosc on 8/12/16.
 */
let common = require('../../common')
let co = require('co')
var rq = require('request');
//"CC:1B:E0:E0:59:60"
//var isTarget = "0802A6";
                //0802A697225585
//0802A6E0D6CC0D

var istar1 = "E3:B1:4A:23:52:7C";
var istar2 = "D9:D0:E8:A0:D8:2D";
var istar3 = "EB:73:71:46:43:34";
//0802A6DF90E6A9
var targetMap = {};


var f1 = false;
var f2 = false;
var f3 = false;
exports.onScan = function (data) {
    if ((!data.bdaddrs[0].bdaddr.match(istar1))&&(!data.bdaddrs[0].bdaddr.match(istar2))&&(!data.bdaddrs[0].bdaddr.match(istar3))) return;
    if (isConnecting) return;
    isConnecting = true
    f1 = false;
    f2 = false;
    f3 = false;
    console.log('mached zewa');
    let deviceMac = data.bdaddrs[0].bdaddr;

    co(function* () {
        targetMap[deviceMac] = true;
        yield common.connect(deviceMac,"random");
        yield common.writeByHandle(deviceMac, '12', '0200');
        yield common.writeByHandle(deviceMac, '17', '0100');
        yield common.writeByHandle(deviceMac, '22', '0200');
    })
};

exports.onNotify = function (data) {
    if (!targetMap[data.id]) return;
    let deviceMac = data.id;
    handleNotifyData(data);
};
var info = {
    "CC:1B:E0:E0:59:60":{
        "E3:B1:4A:23:52:7C":{
            "password":"7c52234a",
            "randomNumber":""
        }
    }
};

//2dd8a0e8


var password = "7c52234a";
var randomNumber = "";

function handleNotifyData(data){
        //data = data.value;
    if((data.value.slice(0,2) == "a0")||(data.value.slice(0,2) == "A0")){
        if(f2) return;
        f2 = true;

        info[hubMac] = info[hubMac] || {};
        var a = info[hubMac],
            b = a[data.id] || {};
        b.password = data.value.slice(2,10) || '';
        info[hubMac][data.id] = b;

        //password = data.value.slice(2,10);


        console.log("获得password:",info[hubMac][data.id].password);
        co(function* () {

        yield common.writeByHandle(data.id, '19', '21e0d6cc0d');
        })


    }
    else if((data.value.slice(0,2) == "a1")||(data.value.slice(0,2) == "A1")){
        if(f1) return;
        f1 = true;
        if(!info[hubMac]) return;
        if(!info[hubMac][data.id]) return;
        info[hubMac][data.id].randomNumber=data.value.slice(2,10);
        console.log("获得randomNum:",info[hubMac][data.id].randomNumber);

        var xornum = getXORdata(hubMac,data.id);
        console.log("获得xor:",xornum);

        console.log("新的xor:",xornum);
        co(function* () {

            yield common.writeByHandle(data.id, '19', "20" + xornum);
            yield common.writeByHandle(data.id, '19', '02e2d6cc0d');
            yield common.writeByHandle(data.id, '19', '22');
        })
    }

    else{
        if (f3) return;
        f3 = true;

        var gy = parseInt(data.value.slice(2, 4), 16);
        var dy = parseInt(data.value.slice(6, 8), 16);
        var mb = parseInt(data.value.slice(22, 24), 16);
        console.log(data.id, '高压：', gy, '低压', dy, '脉搏', mb);
        process.send({
            type: 'event',
            data: {
                device: 'xueya',
                value: 'High Blood Pressure: ' + gy + ' SYS mmHg</br>' + 'Low Blood Pressure: ' + dy + ' DIA mmHg</br>' + 'Heartbeat: ' + mb + ' Pul/min',
                mac: data.id
            },
            postData: [{
                type: 'BP',
                value: gy + ':' + dy + ':' + mb,
                mac: data.id,
                hub_mac: hubMac,
                timestamp: parseInt(Date.now() / 1000)
            }]
        })


    }



}

function getXORdata(hubmac,device){
    if(!info[hubmac]) return null;
    if (!info[hubmac][device]) return null;
    var a = parseInt(info[hubmac][device].password,16) ^ parseInt(info[hubmac][device].randomNumber,16);
    return a.toString(16);

}

setInterval(function(){
    console.log(info);
},60000);
