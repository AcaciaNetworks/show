/**
 * Created by zhaosc on 9/22/16.
 */
let request = require('request');

/**
 * send bp data to ihealth
 * @param {String} mac - device mac
 * @param {String|Number} sbp
 * @param {String|Number} dbp
 * @param {String|Number} hr
 * */
exports.saveBP = function saveBP(mac, sbp, dbp, hr) {
    let now = (Date.now() / 1000).toFixed();
    let form = {
        Un: '',
        VerifyToken: '',
        SC: '7c789858c0ec4ebf8189ebb14b6730a5',
        SV: '3ae4618f19f64aa89446719af52db000',
        AppVersion: 'TestApi5.0',
        AppGuid: 'aedc1fcec6c64fb08d6341dfec701b52',
        PhoneOS: 'ios7',
        PhoneName: 'iphone',
        PhoneID: '1725dc306fcb5cca41b239d9fb6715bf66b583a2',
        PhoneLanguage: 'English',
        PhoneRegion: 'USA',
        QueueNum: '111111',
        MechineDeviceID: mac.replace(/:/g, ''),
        UploadData: JSON.stringify([{
            "MechineType": "1",
            "LastChangeTime": now,
            "PhoneCreateTime": now,
            "TimeZone": 8,
            "MeasureType": 0,
            "IsArr": 0,
            "BPL": 0,
            "MeasureTime": now,
            "PhoneDataID": "091faab437004f7db9e20d3a1cec0b58" + now,
            "HP": sbp,
            "HR": hr,
            "LP": dbp,
            "ChangeType": 1,
            "Lat": 72,
            "Lon": 135,
            "Activity": 1,
            "Mood": 1,
            "Weather": "",
            "WL": [80, 90, 100, 110, 120],
            "TakePill": 1
        }])
    };
    request.post('https://api.ihealthlabs.com.cn:8443/api5/anonymousbp_upload.htm', {
        form
    }, (err, res, body)=> {
        console.log('bp', err, res.statusCode, body)
    })
};


exports.saveXueYang = function saveWeight(mac, xy, hr) {
    let now = (Date.now() / 1000).toFixed();
    let form = {
        Un: '',
        VerifyToken: '',
        MechineDeviceID: mac.replace(/:/g, ''),
        sc: '7c789858c0ec4ebf8189ebb14b6730a5',
        sv: 'f0d8b10f2b8f48ec9939cf4efbfe366e',
        AppVersion: 'TestApi5.0',
        AppGuid: '533649c4e787404cbdc1b022311325af',
        PhoneOS: 'ios7',
        PhoneName: 'iphone',
        PhoneID: '1725dc306fcb5cca41b239d9fb6715bf66b583a2',
        PhoneLanguage: 'English',
        PhoneRegion: 'USA',
        QueueNum: '111111',
        UploadData: JSON.stringify([{
            "MechineType": "1",
            "MeasureTime": now,
            "LastChangeTime": now,
            "PhoneCreateTime": now,
            "TimeZone": 8,
            "PhoneDataID": "8020f63134c747338bea05f1c9063d3c" + now,
            "ChangeType": 1,
            "Wave": [10, 20, 30],
            "Activity": 1,
            "PR": hr,
            "Result": xy,
            "AppVersionForData": "",
            "FlowRate": 16,
            "ResultSource": 1,
            "Lat": 163,
            "Lon": 105,
            "Mood": 1,
            "Weather": "",
            "PI": 15
        }])
    };
    request.post('https://api.ihealthlabs.com.cn:8443/api5/anonymousoxygen_upload.ashx', {
        form
    }, (err, res, body)=> {
        console.log('xueYang', err, res.statusCode, body)
    })
};

exports.saveWeight = function saveWeight(mac, weight) {
    let now = (Date.now() / 1000).toFixed();
    let form = {
        Un: '',
        VerifyToken: '',
        MechineDeviceID: mac.replace(/:/g, ''),
        sc: '7c789858c0ec4ebf8189ebb14b6730a5',
        sv: '9f80b0dafe394009a28756d17d077472',
        AppVersion: 'TestApi5.0',
        AppGuid: 'a4d02370d808467eb41becfb0d9e86f6',
        PhoneOS: 'ios7',
        PhoneName: 'iphone',
        PhoneID: '1725dc306fcb5cca41b239d9fb6715bf66b583a2',
        PhoneLanguage: 'English',
        PhoneRegion: 'USA',
        QueueNum: '111111',
        UploadData: JSON.stringify([{
            "MechineType": 1,
            "LastChangeTime": now,
            "PhoneCreateTime": now,
            "TimeZone": 8,
            "BMI": 10,
            "BoneValue": 1.898,
            "DCI": 342,
            "FatValue": 106,
            "MuscaleValue": 101,
            "WaterValue": 13,
            "WeightValue": weight,
            "VisceraFatLevel": 25,
            "MeasureType": 0,
            "MeasureTime": now,
            "PhoneDataID": "927ed802dc044e1b871c0d4d7c1fac44" + now,
            "ChangeType": 1,
            "Lat": 178,
            "Lon": 1,
            "Activity": 1,
            "Mood": 1,
            "Weather": ""
        }])
    };
    request.post('https://api.ihealthlabs.com.cn:8443/api5/anonymousweight_upload.htm', {
        form
    }, (err, res, body)=> {
        console.log('weight', err, res.statusCode, body)
    })
};


//const querystring = require('querystring');

//let bp = 'Un=&VerifyToken=&SC=7c789858c0ec4ebf8189ebb14b6730a5&SV=3ae4618f19f64aa89446719af52db000&AppVersion=TestApi5.0&AppGuid=aedc1fcec6c64fb08d6341dfec701b52&PhoneOS=ios7&PhoneName=iphone&PhoneID=1725dc306fcb5cca41b239d9fb6715bf66b583a2&PhoneLanguage=English&PhoneRegion=USA&QueueNum=111111&MechineDeviceID=004D3201B74A&UploadData=[{"MechineType":"1","LastChangeTime":1474563736,"PhoneCreateTime":1474456336,"TimeZone":8,"MeasureType":0,"IsArr":0,"BPL":0,"MeasureTime":1474510036,"PhoneDataID":"091faab437004f7db9e20d3a1cec0b58","HP":107,"HR":41,"LP":15,"ChangeType":1,"Lat":72,"Lon":135,"Activity":1,"Mood":1,"Weather":"","WL":[80,90,100,110,120],"TakePill":1}]';
//
//let weight = 'Un=&VerifyToken=&MechineDeviceID=aaa123&sc=7c789858c0ec4ebf8189ebb14b6730a5&sv=9f80b0dafe394009a28756d17d077472&AppVersion=TestApi5.0&AppGuid=a4d02370d808467eb41becfb0d9e86f6&PhoneOS=ios7&PhoneName=iphone&PhoneID=1725dc306fcb5cca41b239d9fb6715bf66b583a2&PhoneLanguage=English&PhoneRegion=USA&QueueNum=111111&UploadData=[{"MechineType":1,"LastChangeTime":1474563084,"PhoneCreateTime":1474466244,"TimeZone":8,"BMI":10,"BoneValue":1.898,"DCI":342,"FatValue":106,"MuscaleValue":101,"WaterValue":13,"WeightValue":38,"VisceraFatLevel":25,"MeasureType":0,"MeasureTime":1474514664,"PhoneDataID":"927ed802dc044e1b871c0d4d7c1fac44","ChangeType":1,"Lat":178,"Lon":1,"Activity":1,"Mood":1,"Weather":""}]';
//
//let xueYang = 'Un=&VerifyToken=&MechineDeviceID=aaa123&sc=7c789858c0ec4ebf8189ebb14b6730a5&sv=f0d8b10f2b8f48ec9939cf4efbfe366e&AppVersion=TestApi5.0&AppGuid=533649c4e787404cbdc1b022311325af&PhoneOS=ios7&PhoneName=iphone&PhoneID=1725dc306fcb5cca41b239d9fb6715bf66b583a2&PhoneLanguage=English&PhoneRegion=USA&QueueNum=111111&UploadData=[{"MechineType":"1","MeasureTime":1474531517,"LastChangeTime":1474531517,"PhoneCreateTime":1474497917,"TimeZone":8,"PhoneDataID":"8020f63134c747338bea05f1c9063d3c","ChangeType":1,"Wave":[10,20,30],"Activity":1,"PR":23,"Result":67,"AppVersionForData":"","FlowRate":16,"ResultSource":1,"Lat":163,"Lon":105,"Mood":1,"Weather":"","PI":15}]';
//
////console.log(querystring.parse(xueYang));