/**
 * Created by zhaosc on 8/12/16.
 */
let express = require('express')
let sse = require('server-side-event')();

let app = express()

//config
let port = 8888
let defaultHub = 'CC:1B:E0:E0:1B:04'

app.listen(port, function () {
    console.log('listening on port: ', port)
})

let hub = require('./hub')


//refresh token
app.get('/token', function (req, res) {
    let hubMac = req.query.mac || defaultHub
    hub.start(hubMac)
        .then(()=> {
            res.end('')
        })
        .catch(e=> {
            res.end('offline')
        })
});

//hub.start(defaultHub)

app.get('/event', function (req, res) {
    var hubMac = req.query.mac || defaultHub;
    sse(res);
    hub.addEvent(hubMac, res, req.query.callback || '');
    res.on('close', ()=> {
        console.log('client closed', hubMac);
        hub.stop(hubMac)
    })
});

//static file
app.use('/', express.static(__dirname + '/static'));