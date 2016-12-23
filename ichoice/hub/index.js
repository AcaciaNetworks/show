/**
 * Created by zhaosc on 9/20/16.
 */
let process = require('child_process');
let EventSource = require('eventsource');
let req = require('request');

let toWatch = {};
let cloudAddress = 'http://127.0.0.1:3000';
let userId = 'ihealthlabs';
let secret = '8d8b93bb2d0ff8d9';
//get token
function auth() {
    return new Promise(function (resolve, reject) {
        req.post(`/oauth2/token`, {
            baseUrl: cloudAddress,
            json: true,
            headers: {
                Authorization: 'Basic ' + new Buffer(userId + ':' + secret, 'ascii').toString('base64')
            },
            body: { grant_type: 'client_credentials' }
        }, function (err, res, body) {
            if (err) return reject(err);
            resolve(body.access_token)
        })
    })
}

auth()
    .then(token => {
        let watch = new EventSource(`${cloudAddress}/cassia/hubStatus?access_token=${token}`);
        watch.onmessage = function watch(e) {
            if (e.data.match('keep-alive')) return;
            let status = JSON.parse(e.data);
            console.log(status);
            if (toWatch[status.mac] && status.status !== 'online') {
                exports.stop(status.mac, true);
            }
        };

        watch.onerror = function (e) {
            console.error('watch', e)
        };
    });


let hubs = {};

exports.start = function start(mac) {
    toWatch[mac] = true;
    let theHub = hubs[mac];
    if (!theHub) {
        theHub = initialProcess(mac);
    } else {
        theHub.count++;
    }
    return new Promise((resolve, reject) => {
        theHub.send({
            type: 'token'
        });
        theHub.on('message', function tokenHandler(arg) {
            if (arg.type != 'tokenHandler') return;
            theHub.removeListener('message', tokenHandler);
            if (arg.ok) {
                resolve()
            } else {
                exports.stop(mac);
                reject()
            }
        });
    })
};

exports.stop = function stop(mac, isForce) {
    let theHub = hubs[mac];
    if (!theHub) return;
    if (isForce) {
        console.log('stop', mac);
        theHub.removeAllListeners();
        theHub.kill();
        delete hubs[mac];
        theHub = null
        resArr.forEach(function (res) {
            res.push({
                type: 'offline'
            });
            res.end();
        })
        resArr = []
        return
    }
    console.log('hub count', theHub.count);
    theHub.count--;
    if (theHub.count < 1) {
        console.log('stop', mac);
        theHub.removeAllListeners();
        theHub.kill();
        delete hubs[mac];
        theHub = null
        resArr.forEach(function (res) {
            res.push({
                type: 'offline'
            });
            res.end();
        })
        resArr = []
    }
};

let resArr = []
exports.addEvent = function addEvent(mac, res) {
    resArr.push(res)
    let theHub = hubs[mac];
    if (!theHub) {
        theHub = initialProcess(mac);
    }

    theHub.on('message', arg => {
        if (arg.type == 'offline') {
            res.push({
                type: 'offline'
            });
            res.end();
        }
        if (arg.type != 'event') return;
        console.log('event', mac, arg);
        res.push({
            type: 'data',
            data: arg.data
        });
    })
};

function initialProcess(mac) {
    let theHub;
    theHub = hubs[mac] = process.fork(__dirname + '/init.js', [mac, userId, secret, cloudAddress]);
    theHub.mac = mac
    theHub.count = 1;

    theHub.on('message', arg => {
        if (arg.type == 'offline') {
            exports.stop(mac);
        }
    });
    theHub.on('exit', function (code, signal) {
        console.log('exit', code, signal)
        if (theHub) {
            console.log(theHub.mac)
            delete hubs[theHub.mac]
            theHub = null
        }
    })
    return theHub
}