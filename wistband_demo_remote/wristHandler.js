var event = require("events");
var request = require('request');
var emitter = new event();
var isConnecting = {};
var allData = [];

var devices = [];
var names = [];

var hub_chip = {};
var max = 15;
var kusi=[];

var check = {};


function addDevice(){
    for (let i in devices){
        let single = {
            "mac":"",
            "heartRate":0,
            "stepNumber":0,
            "base":0,
            "realTime":0,
            "cal":0,
            "state":true,
            "name":""
        };
        single.mac = devices[i];
        single.name = names[i];
        allData.push(single);
    }
    console.log("devices:",devices);
}
function handleConnectionStateData(data, hub) {
    if (data.match("keep")) return;

    try {
        data = JSON.parse(data);
    } catch (e) {
        return;
    }
    console.log("连接状态变化:", data.handle, data.connectionState);
    if (data.connectionState == "disconnected") {
        for(var i in allData){
            if(allData[i].mac == data.handle){
                if(hub_chip[data.handle]){
                    delete hub_chip[data.handle];
                }
                allData[i].state = false;
            }
        }
    }else{
        for(var i in allData){
            if(allData[i].mac == data.handle){

                if(!hub_chip[data.handle]){
                    console.log("######################连接状态不匹配");
                }
                allData[i].state = true;
            }
        }
    }
}

function handleKsportData(data){
    //console.log("receive kusi");

    for(var i in allData){
        if(allData[i].mac == data.id){
            if(data.value.length > 4){
                let count = parseInt(data.value.slice(22,26),16);
                allData[i].stepNumber = count;
                allData[i].realTime = count - allData[i].base;
                allData[i].cal = allData[i].realTime *5.24;
                allData[i].state = true;
            }else {
                allData[i].heartRate = parseInt(data.value,16);
                allData[i].state = true;
            }
        }
    }
}
function handleV05data(data){
    if(data.value.length>12) return;
    let type = data.value.slice(0,2);
    let count = 0;
    if (type == "a8") {
        count = parseInt(data.value.slice(2, 10), 16);
    }

    if(type == "d0"){
        count = parseInt(data.value.slice(2,4),16);
    }
    for(var i in allData){
        if(allData[i].mac == data.id){
            if(type == "a8"){
                allData[i].stepNumber = count;
                allData[i].realTime = count - allData[i].base;
                allData[i].cal = allData[i].realTime *5.24;
                allData[i].state = true;
            }
            if (type == "d0"){
                allData[i].heartRate = count;
                allData[i].state = true;
            }
        }
    }
}
function handleNotifyData(data, hub) {
    if (data.match("keep")) return;
    try {
        data = JSON.parse(data);
    } catch (e) {
        return;
    }

    if(kusi.indexOf(data.id) != -1){
        handleKsportData(data)
    }else{

        handleV05data(data);
    }


    if (check[data.id]) {
        check[data.id].flag = true;
        check[data.id].hubMac = hub;
        check[data.id].data = data.value;
    } else {
        var state = {
            "flag": true,
            "hubMac": hub,
            "data": data.value
        };
        check[data.id] = state;
    }
    //console.log("notify:", data.value, ">>>>>>>>", data.id);
}
function existDevice(mac){
    var  flag = false;
    for(var i in allData){
        if(allData[i].mac == mac){
            flag = true;
        }
    }
    return flag;
}
function handleScanData(data, hub) {
    if (data.match("keep")) return;
    data.replace("data: ", "");
    try {
        data = JSON.parse(data);
    } catch (e) {
        return;
    }
    var deviceId = data.bdaddrs[0].bdaddr;
    if(!existDevice(deviceId)) return;
    console.log("扫描到设备:", deviceId);
    if(!isConnecting[hub]){
        isConnecting[hub] = {
            "flag":false,
            "count":0
        }
    }
    if(isConnecting[hub].count > 40){
        isConnecting[hub] = {
            "flag":false,
            "count":0
        }
    }
    if(isConnecting[hub].flag){
        isConnecting[hub].count ++;
        console.log("正在连接设备!");
    }else{

        if (data.name.match("HW")){
            isConnecting[hub].flag = true;
            if(kusi.indexOf(deviceId)==-1){
                kusi.push(deviceId);
            }
            connectKsportDevice(deviceId,hub);
        }else{
            console.log("!!!!!!!",hub);
            isConnecting[hub].flag = true;
            connectV05Device(deviceId,hub);
        }
    }
}
function connectV05Device(deviceMac,hub) {
    var chip0 = 0;
    var chip1 = 0;
    var chip = "0";
    for(let mac in hub_chip){
        if(hub_chip[mac] == "0"){
            chip0++;
        }else{
            chip1++;
        }
    }
    if((chip0+chip1) >= max) return;
    if(chip0 > 7){
        chip = "1";
        console.log("chip!!!!!!!!!!!!!!!!:",chip0);
    }
        let access_token = headers.Authorization.replace("Bearer ", "");
    console.log("连接芯片:",chip);
        request.post('http://api1.cassianetworks.com/gap/nodes/' + deviceMac + '/connection'+'?mac='+hub+'&access_token='+access_token+'&chip='+chip, {
            form: {
                timeOut: '1',
                type: 'random'
            }
        }).on('response', function (res) {
            res.on('data', function (data) {
                console.log('连接结束',hub);
                if (data == "OK") {
                    if (chip == "0") {
                        hub_chip[deviceMac] = "0";
                    } else {
                        hub_chip[deviceMac] = "1";
                    }
                    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
                    isConnecting[hub].flag = false;
                    isConnecting[hub].count = 0;

                    writeByHandle(hub, deviceMac, "29", "0100", function () {
                        writeByHandle(hub,deviceMac,"31","d001",function(){
                            writeByHandle(hub, deviceMac, "31", "a803", function () {
                                checkNotifyBuffer(hub, deviceMac);

                            });
                        });
                    });
                } else {
                    isConnecting[hub].flag = false;
                    isConnecting[hub].count = 0;
                    console.log("连接失败", deviceMac, data.toString());
                }
            })
        });
}


function connectKsportDevice(deviceMac,hub){
    var chip0 = 0;
    var chip1 = 0;
    var chip = "0";
    for(let mac in hub_chip){
        if(hub_chip[mac] == "0"){
            chip0++;
        }else{
            chip1++;
        }
    }
    if((chip0+chip1) >= max) return;
    if(chip0 > 7){
        chip = "1";
        console.log("chip!!!!!!!!!!!!!!!!:",chip0);
    }
    let access_token = headers.Authorization.replace("Bearer ", "");



    console.log("连接酷思");
    request.post('http://api1.cassianetworks.com/gap/nodes/' + deviceMac + '/connection'+'?mac='+hub+'&access_token='+access_token+'&chip='+chip, {
        form: {
            timeOut: '1',
            type: 'random'
        }
    }).on('response', function (res) {
        res.on('data', function (data) {
            console.log('连接结束' + data);
            if (data == "OK") {

                if (chip == "0") {
                    hub_chip[deviceMac] = "0";
                } else {
                    hub_chip[deviceMac] = "1";
                }

                isConnecting[hub].flag = false;
                isConnecting[hub].count = 0;                writeByHandle(hub, deviceMac, "23", "0100", function () {
                    writeByHandle(hub,deviceMac,"17","0100",function(){
                        writeByHandle(hub, deviceMac, "19", "ff2006000227", function () {
                            writeByHandle(hub, deviceMac, "19", "ff000c000501100401010128", function () {
                                checkNotifyBuffer(hub, deviceMac);

                            });
                        });
                    });
                });
            } else {
                isConnecting[hub].flag = false;
                isConnecting[hub].count = 0;                                        console.log("连接失败", deviceMac, data);
            }
        })
    });
}





function writeByHandle(hub, deviceMac, handle, value, fn) {
        let access_token = headers.Authorization.replace("Bearer ", "");
        request.get('http://api1.cassianetworks.com/gatt/nodes/' + deviceMac + '/handle/' + handle + '/value/' + value+'?mac='+hub+'&access_token='+access_token).on('response', function (res) {
            res.on('data', function (data) {
                console.log('write by handle:' + data);
                fn();
            });
        });
}
process.on('uncaughtException', (err) => {
    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", err);
});
function alldata(){
    return allData;
}
function startCount(mac){
    for(var i in allData){
        if(allData[i].mac == mac){
                allData[i].base = allData[i].stepNumber;
                allData[i].realTime = 0;
                allData[i].cal = 0;
        }
    }
}
function oAuth(fn) {
    fn();
}
function startWork(devices_names){
    devices = [];
    names = [];
    allData = [];
    for(var device in devices_names){
        devices.push(device);
        names.push(devices_names[device]);
    }
    addDevice();
}

function checkNotifyBuffer(hub, deviceMac) {
    setTimeout(function (hub, deviceMac) {
        console.log("定时检查是否报数");
        if (!check[deviceMac]) {
            disconnectDevice(heck[deviceMac].hubMac, deviceMac);
            return;
        }
        if (check[deviceMac].flag) {
            check[deviceMac].flag = false;
            checkNotifyBuffer(check[deviceMac].hubMac, deviceMac);
        } else {
            disconnectDevice(check[deviceMac].hubMac, deviceMac);
        }
    }.bind(null, hub, deviceMac), 15000);
}

function disconnectDevice(hub, deviceMac) {
    console.log("主动断连", hub, deviceMac);

    let access_token = headers.Authorization.replace("Bearer ", "");

    request.del('http://api1.cassianetworks.com/gap/nodes/' + deviceMac + '/connection?mac='+hub+'&access_token='+access_token, {
        form: {
            timeOut: '1',
            type: 'random'
        }
    }).on('response', function (res) {
        res.on('data', function (data) {
            console.log('disconnect结束:' + data);
        });
    });
}
process.on('uncaughtException', (err) => {
    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", err);
});

module.exports = function () {
    emitter.handleConnectionStateData = handleConnectionStateData;
    emitter.handleNotifyData = handleNotifyData;
    emitter.handleScanData = handleScanData;
    emitter.alldata = alldata;
    emitter.startCount = startCount;
    emitter.startWork = startWork;

    return emitter;
};