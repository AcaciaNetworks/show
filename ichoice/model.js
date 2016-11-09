/**
 * Created by zhaosc on 8/15/16.
 */

var memData = {};
exports.save = function (data) {
    memData[data.type] = data;
};

exports.get = function () {
    return Object.assign({}, memData);
};

exports.clear = function (key) {
    if(key) {
        delete memData[key]
        return;
    }
    memData = {}
};