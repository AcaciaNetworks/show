/**
 * Created by zhaosc on 9/20/16.
 */
let express = require('express');

let app = express();
let port = 8888;

app.listen(port, function () {
    console.log('listening on port: ', port)
});

let hub = require('./hub');

//refresh token
app.get('/token', function (req, res) {
    hub.start(req.query.mac)
        .then(()=> {
            res.end('')
        })
        .catch(e=> {
            res.end('offline')
        })
});

// hub.start('CC:1B:E0:E0:21:E4');
//hub.start('CC:1B:E0:E0:16:34');

//server-side-event
let sse = require('server-side-event')();
app.get('/event', function (req, res) {
    var hubMac = req.query.mac;
    sse(res);
    hub.addEvent(hubMac, res);
    res.on('close', ()=> {
        console.log('client closed', hubMac);
        hub.stop(hubMac)
    })
});

//static file
app.use('/', express.static(__dirname + '/static'));