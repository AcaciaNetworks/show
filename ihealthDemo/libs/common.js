/**
 * Created by zhaosc on 9/20/16.
 */


/**
 * get uuid from addata
 * @param {String} data - addata from scan
 * */
exports.getUUID = function getUuid(data) {
    var uuid = '';
    var isFinding = true;
    var basePos = 0;
    while (isFinding && basePos < data.length) {
        var len = data.slice(basePos, basePos + 2);
        len = parseInt(len, 16);
        var type = data.slice(basePos + 2, basePos + 4);
        type = parseInt(type, 16);
        if (type == 6) {
            isFinding = false;
            uuid = data.slice(basePos + 4, basePos + 2 * len + 2);
        }
        basePos += 2 + 2 * len
    }
    //eslint-disable-next-line
    var i = l = uuid.length;
    var ret = '';
    while (i > 0) {
        ret += uuid.slice(i - 2, i);
        i = i - 2;
    }
    return ret
};

/**
 * turn string to a uuid
 * @param {String} str
 * @param {Boolean} [_]
 * */
exports.toUUID = function toUUID(str, _) {
    let ret = '';
    for (let i = 0, l = str.length; i < l; i++) {
        ret += str.charCodeAt(i).toString(16).toUpperCase()
    }
    if (_) {
        ret = ret.slice(0, 8) + '-' + ret.slice(8, 12) + '-' + ret.slice(12, 16) +
            '-' + ret.slice(16, 20) + '-' + ret.slice(20);
    }
    return ret;
};

exports.hexToString = function hexToString(str) {
    let ret = '';
    for (let i = 0, l = str.length; i < l; i += 2) {
        let tmp = str.slice(i, i + 2);
        ret += String.fromCharCode(parseInt(tmp, 16))
    }
    return ret
};

/**
 * connect device
 * @param {String} deviceMac
 * @param {String} deviceType
 * @param {String} deviceProtocol
 * @param {String} [type]
 * */
exports.connect = function connect(deviceMac, deviceType, deviceProtocol, type) {
    console.log('real connect', deviceMac);
    return new Promise((resolve, reject) => {
        let t = setTimeout(reject, 30000);
        req.post('/gap/nodes/' + deviceMac + '/connection', {
            body: {
                type: type || 'public',
                sub_type: 'ihealth',
                product_id: deviceType,
                product_seq: deviceProtocol
            }
        }, function (err, res, body) {
            t && clearTimeout(t);
            isConnecting = false;
            if (err) {
                console.error('connect error', deviceMac, err)
                return reject(err)
            }
            if (res.statusCode !== 200) {
                reject(res.statusCode + '-' + JSON.stringify(body))
            } else {
                resolve()
            }
        })
    });
};

/**
 * write by handler
 * @param {String} deviceMac
 * @param {String} handle
 * @param {String} value
 * */
exports.writeByHandle = function (deviceMac, handle, value) {
    return new Promise(function (resolve, reject) {
        req.get(`/gatt/nodes/${deviceMac}/handle/${handle}/value/${value}`, function (err, status, body) {
            if (err) reject(err);
            resolve(body)
        });
    })
        .then(function (ret) {
            console.log('write handle', ret, handle, value);
        })
        .catch(function (e) {
            console.error('writeByHandle err', deviceMac, handle, value, e);
        })
};

/**
 * read by handle
 * @param {String} deviceMac
 * @param {String} handle
 * */
exports.readByHandle = function (deviceMac, handle) {
    return new Promise(function (resolve, reject) {
        req.get(`/gatt/nodes/${deviceMac}/handle/${handle}/value`, function (err, status, body) {
            if (err) reject(err);
            resolve(body)
        });
    })
        .then(function (ret) {
            console.log('read handle', handle, ret);
            return ret;
        })
        .catch(function (e) {
            console.error('readByHandle', deviceMac, handle ,e);
        })
};

exports.getTime = function () {
    let now = new Date;
    let timeStr = parseInt(now.getTime() / 1000).toString(16);
    timeStr += ('0000' + Math.abs(-now.getTimezoneOffset()).toString(16)).slice(-4);
    return timeStr
};

//console.log(exports.hexToString('4b4e2d35353042542031313037300000'));
//console.log(exports.toUUID('sed.jiuan.BPAV10'))
//console.log(exports.toUUID('rec.jiuan.BPAV10', true))

//console.log(exports.getTime());