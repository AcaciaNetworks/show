/**
 * Created by zhaosc on 8/12/16.
 */
var http = require('http');
var EventEmitter = require('events');
var baseOption = {
    //hostname: 'api.cassianetworks.com'
    hostname: 'demo.cassianetworks.com'
};
var httpHeader = {};
var userId = 'xin', userSecret = '0bda052bf4403a5f';
//var userId = 'zsc', userSecret = '7142a6f0e13265aa';

var dataReg = /^data:\s*/;

/**
 * param {Object} option - {path,method,body}
 * return Promise.resolve with data or response, decided by isSSE,
 * if is not SSE resolve with data, else resolve with response.
 * you should listen 'data' on response
 * */
function request(_option) {
    var isSSE;
    return new Promise(function (resolve, reject) {
        var option = Object.assign(_option, baseOption);
        option.headers = Object.assign({}, httpHeader);
        var bodyStr = '';
        if (option.method == 'POST' || option.method == 'PUT') {
            bodyStr = JSON.stringify(option.body);
            option.headers['Content-Type'] = 'application/json';
            option.headers['Content-Length'] = Buffer.byteLength(bodyStr)
        }
        var req = http.request(option, function (res) {
                    var statusCode = res.statusCode;
                    var contentType = res.headers['content-type'];
                    if (contentType == 'text/event-stream') isSSE = true;
                    res.setEncoding('utf-8');
                    if (isSSE) {
                        //return a eventEmitter instance
                        //which will emit data event
                        var sse = new EventEmitter();
                        sse.destroy = function () {
                            sse.removeAllListeners();
                            sse = null;
                            res.destroy();
                        };
                        resolve(sse);
                        setTimeout(function () {
                            var bufferStr = '';
                            var minLen = 0;
                            res.on('data', function (data) {
                                bufferStr += data;
                                while (bufferStr.length > minLen) {
                                    var lnIndex = bufferStr.indexOf('\n\n', 4);
                                    if (lnIndex == -1) return;
                                    var d = bufferStr.slice(0, lnIndex);
                                    bufferStr = bufferStr.slice(lnIndex);
                                    d = d.trim();
                                    d = d.replace(dataReg, '');
                                    if (d.startsWith(':')) return;
                                    try {
                                        d = JSON.parse(d);
                                        sse.emit('data', d);
                                    } catch (e) {
                                        if (e.name == 'SyntaxError' && e.message.indexOf('JSON') > -1) {
                                            if (d == 'hub offline') {
                                                sse.emit('error', 'hub offline');
                                                return sse.destroy();
                                            }
                                            bufferStr = d + bufferStr;
                                            minLen = d.length;
                                            console.log('_______', d, d.length);
                                            console.log('========', bufferStr, bufferStr.length);
                                            if (bufferStr.length > 3000) process.exit()
                                        } else {
                                            console.log(e)
                                        }
                                    }
                                }
                            });
                        });
                    } else {
                        var body = '';
                        res.on('data', function (data) {
                            body += data;
                        });
                        res.on('end', function () {
                            res.removeAllListeners();
                            if (200 <= statusCode && statusCode < 300) {
                                resolve(body);
                            }
                            else {
                                reject(body)
                            }
                        });
                        res.on('error', function (e) {
                            console.log(e, 'res error');
                            reject(e)
                        })
                    }
                }
            )
            ;
        req.on('error', function (e) {
            console.log(e, 'req error');
            reject(e)
        });
        if (option.method == 'POST' || option.method == 'PUT') {
            req.write(bodyStr);
        }
        req.end();
    })
}

request.httpHeader = httpHeader;
request.auth = function auth() {
    delete httpHeader['Authorization'];
    return request({
        method: 'POST',
        auth: userId + ':' + userSecret,
        path: '/oauth2/token',
        body: {grant_type: 'client_credentials'}
    })
        .then(function (ret) {
            ret = JSON.parse(ret);
            console.log(ret);
            request.httpHeader['Authorization'] = 'Bearer ' + ret.access_token;
            return ret.access_token;
        })
        .catch(function (e) {
            console.error(arguments)
        })
};

module.exports = request;