/**
 * Created by zhaosc on 9/18/16.
 */
var request = require('request');

exports.writeByHandler = function writeByHandler(deviceMac, handle, value) {
    return new Promise(function (resolve, reject) {
        request({
            method: 'GET',
            path: '/gatt/nodes/' + deviceMac + '/handle/' + handle + '/value/' + value + '?mac=' + hubMac
        })
            .then(function (ret) {
                resolve(ret)
            })
            .catch(function (e) {
                reject(e)
            })
    })
        .then(function (ret) {
            console.log('write handle', ret, handle, value);
        })
        .catch(function (e) {
            console.log(e);
        })
};