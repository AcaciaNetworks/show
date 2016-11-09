/**
 * Created by zhaosc on 9/20/16.
 */

global.isConnecting = false;
global.userId = 'ihealthlabs';
//global.userId = 'zsc';
global.secret = '8d8b93bb2d0ff8d9';
//global.secret = '7142a6f0e13265aa';
global.cloudAddress = 'http://demo.cassianetworks.com';

global.headers = {
    Authorization: 'Basic ' + new Buffer(userId + ':' + secret, 'ascii').toString('base64')
};
global.hubMac = process.argv[2];

let request = require('request');
let EventSource = require('eventsource');

let devices = [];
devices.push(require('../device/BP'));
devices.push(require('../device/HS4'));
devices.push(require('../device/PO3'));

//handler message from parent
process.on('message', arg=> {
    //refresh token and check is hub online
    if (arg.type == 'token') {
        auth();

        isHubOnline().then(()=> {
            process.send({
                type: 'tokenHandler',
                ok: true
            })
        })
            .catch(err=> {
                process.send({
                    type: 'tokenHandler',
                    ok: false
                })
            });
    }
    console.log(hubMac, 'child message', arg);
});


//get token
function auth() {
    auth.t && clearTimeout(auth.t);
    auth.t = setTimeout(auth, 100 * 60 * 1000);
    headers.Authorization = 'Basic ' + new Buffer(userId + ':' + secret, 'ascii').toString('base64');
    global.req = request.defaults({
        baseUrl: cloudAddress,
        json: true,
        qs: {
            mac: hubMac
        },
        headers: headers
    });

    return new Promise(function (resolve, reject) {
        req.post(`/oauth2/token`, {
            body: {grant_type: 'client_credentials'}
        }, function (err, res, body) {
            if (err) return reject(err);
            //console.log('token:', body.access_token);
            headers.Authorization = 'Bearer ' + body.access_token;
            resolve(req)
        })
    })
}

function isHubOnline() {
    return new Promise(function (resolve, reject) {
        req.get('/cassia/hubs/' + hubMac, function (err, status, body) {
            if (err) {
                console.error(err, status, body);
                return reject(err)
            }
            //console.log('isHubOnline', body);
            if (body.match && body.match('offline')) {
                reject()
            } else {
                resolve()
            }
        })
    })
}


function scan() {
    var es = new EventSource(cloudAddress + '/gap/nodes?event=1&chip=0&mac=' + hubMac, {headers});
    es.addEventListener('message', e=> {
        if (e.data.match(':keep-alive')) return;
        if(e.data.match('offline')) return offlineHandler();
        devices.forEach(function (d) {
            d.onScan(JSON.parse(e.data))
        });
    });
    es.addEventListener('error', err=> {
        offlineHandler();
        console.error('scan error' ,err);
    })
}

//start
auth()
    .then(()=> {
        scan();
        //listen connection change
        let es = new EventSource(cloudAddress + '/management/nodes/connection-state?mac=' + hubMac, {headers});
        es.onmessage = function (e) {
            if(e.data.match('offline')) return offlineHandler();
            console.log('connection state change:', e.data)
        };
        es.onerror = function (e) {
            console.error('es', e)
        };

        //listen notify of hub
        let notifyEs = new EventSource(`${cloudAddress}/gatt/nodes?event=1&mac=${hubMac}`, {headers});
        notifyEs.onmessage = function (e) {
            if (e.data.match(':keep-alive')) return;
            if(e.data.match('offline')) return offlineHandler();
            let data = JSON.parse(e.data);
            devices.forEach(d=> {
                d.onNotify(data)
            })
        }
    });

function offlineHandler() {
    process.send({
        type: 'offline'
    })
}