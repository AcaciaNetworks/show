function main() {
	Init()
	$('body').on('click', 'button', function(e) {

		switch (e.target.id) {
			case 'connect':
				// debugger
				globalData.hubIp = $('#hubIp').val().trim()
				verifyInputData(globalData, ['hubIp'])
				if (!globalData.verifyInputData.pass) {
					alert(JSON.stringify(globalData.verifyInputData, ['hubIp'], 2))
					throw new Error('输入参数错误')
				} else {
					api.use({
						server: globalData.hubIp,
						hub: ''
					})

					api.notify(true).on('notify', hubNotifyHandle)
					updateConnPR(3000)
					scanPR(globalData.reg)
				}
				break
			case 'send':
				// clearMed(data.hubIp, data.deviceMac)
				sendHandle()
					// sendMedicine(data)
				break
			case 'clearMed':

				clearMed(data.hubIp, data.deviceMac)
				break
			case 'clearMes':
				clearMes(data.hubIp, data.deviceMac)
				break
			case 'readMed':
				readMed(data.hubIp, data.deviceMac)
				break
			case 'readMes':
				readMes(data.hubIp, data.deviceMac)
				break


		}
	})
}
main()

function sendHandle() {
	let mac = $('#send').data('mac'),
		meds = [],
		item = {},
		name, time, color, name_reg = /^\w{1,8}$/,
		time_reg = /^\d{4}-\d{2}-\w{5}\:\d{2}$/
	if (!mac) {
		alert('Please select your band')
		return
	}
	console.log('sending')
	$('#meds-box .top li').each(function() {
		name = $.trim($(this).find('input').val())
		time = $.trim($(this).find('input').eq(1).val())
		color = $(this).find('select').val()
		if (name === '') {
			alert('medcine name is required')
			return false
		} else if (!name_reg.test(name)) {
			alert('less than 8 characters')
			return false
		}

		if (!time_reg.test(time)) {
			alert('times formate error')
			return false
		}
		item = {
			deviceMac: mac,
			medicine: name,
			medTime: time,
			color: color
		}
		meds.push(item)
	})
	meds.forEach(function(item) {
		sendMedicine(item)
	})


}

var globalData = {
	reg: /^110644454D4D43FFC[0-2]100D0B145F8CF011BA$/i,
	adData: /^0201060B086943686F69636550523[1-2]$/,
	inputData: {
		hubIp: '',
		medsData: {
			currentMAC: '',
			meds: [{
				name: '',
				time: '',
				color: ''
			}]
		}
	},
	allPR: {
		mac: {
			mac: '',
			type: '',
			connection: 'false',
			version: ''
		}
	},
	iChoicePR: {
		temp: {
			mac: 'temp',
			type: '',
			connection: false,
			wantConn: true,
			lastConn: 0,
			battery: '',
			medsHistory: {},
			version: 'pr1'
		}
	},
	connectionPR: {},
	verifyInputData: {},
	timer: {
		checkConnect: null,
		getBattery: null
	},
	lastCommond: 'new',
	d5: [],
	d3: [],
	holdTime: 1000 * 2 * 60
}

holdConnect(globalData.connectionPR, 25, 'aa5502ced0')


function statusAddItem(version, mac) {
	let historyHtml = `<li data-mac=${mac}>
					<p><b>${version}:${mac}</b></p>
					<div class="onePR">
						<div class="left">
							<button data-mac=${mac} class="l-position" data-type='clearMed'>Clear</button>
							<h3 class="">Recipe</h3>
							<button data-mac=${mac} class="r-position" data-type='readMed'>Read</button>
							<div></div>
						</div>
						<div class="center">
							<button data-mac=${mac} class="l-position" data-type='clearMeds'>Clear</button>
							<h3>History</h3>
							<button data-mac=${mac} class="r-position" data-type='readMeds'>Read</button>
							<div></div>
						</div>
						<div class="right">
							<h3>Status</h3>
							<ul></ul>
						</div>
					</div>
				</li>`
		// $('#meds-box').show()
	$('#status ul').append(`<li data-mac=${mac}>
									<span>${version}:${mac}</span>
									<button data-mac=${mac} data-type=0>Disconn</button><button data-type=1 data-mac=${mac}>Setup</button></li>`)



	$('.allPR').append(historyHtml)



}

function statusDelItem(mac) {
	$('#status ul li').remove(`[data-mac='${mac}']`)
	$('ul.allPR').find(`li[data-mac='${mac}']`).remove()
}


function updateConnPR(time) {
	// debugger
	let connectedPR = []
	if (!globalData.timer.checkConnect) {
		globalData.timer.checkConnect = setInterval(_handle, time)
	}
	_handle()

	function _handle() {
		api.devices({
			success: function(data) {
				connectedPR = []
				for (let i of data.nodes) {
					connectedPR.push(i.id)
					if (!(i.id in globalData.connectionPR)) {
						if (i.id in globalData.iChoicePR) {
							globalData.iChoicePR[i.id].connection = true
							globalData.connectionPR[i.id] = {
								mac: i.id,
								version: globalData.iChoicePR[i.id].version
							}
						} else {
							openPRNotify(i.id, getPRversion)
						}
					}

				}
				// debugger
				for (i in globalData.connectionPR) {
					if (connectedPR.indexOf(i) === -1) {
						delete globalData.connectionPR[i]
						statusDelItem(i)
						if (globalData.iChoicePR[i])
							globalData.iChoicePR[i].connection = false
					}
				}
			}
		})
	}
}



/**
 * [openSensorNotify description]
 * @param  {[type]} o [description]
 * @return {[type]}   [description]
 * {
	mac: '',
	writeItems: [{
		handle: 29,
		value: '0100'
	}, {
		handle: 32,
		value: '0100'
	}, {
		handle: 35,
		value: '0100'
	}, {
		handle: 38,
		value: '0100'
	}]
}
 */


function openPRNotify(mac, fn) {
	var o = {
			mac: mac,
			writeItems: [{
				handle: 29,
				value: '0100'
			}, {
				handle: 32,
				value: '0100'
			}, {
				handle: 35,
				value: '0100'
			}, {
				handle: 38,
				value: '0100'
			}]
		},
		successCount = 0
	o.writeItems.forEach(item => {
		api.write({
			node: o.mac,
			handle: item.handle,
			value: item.value,
			success: function() {
				if (fn) {
					successCount++
					if (successCount === 4) {
						fn(o.mac)
					}
				}
			}
		})
	})
}

/**
 * [getPRversion description]
 * @param  {[type]} o [description]
 * @return {[type]}   [description]
 *
 * {
		node:o.mac,
		handle:handle,
		value:value,
		success:success
	}
 */
function getPRversion(mac) {
	api.write({
		node: mac,
		handle: 25,
		value: 'aa5502c0c2'
	})
}



function hubNotifyHandle(hub, data) {
	if (data === 'keep-alive') {
		return
	}
	var _data = JSON.parse(data),
		mac = _data.id,
		handle = _data.handle,
		// checkPRversion_Reg = /^55aa/i,
		lastCommond = globalData.lastCommond,
		d5 = globalData.d5
	d3 = globalData.d3

	console.log(d5)
		// if (!checkPRversion_Reg.test(_data.value)) {
		// 	return
		// }
	if (!(mac in globalData.connectionPR)) {
		globalData.connectionPR[mac] = {
			mac: mac
		}
	}
	if (!globalData.iChoicePR[mac])
		globalData.iChoicePR[mac] = {
			mac: mac,
			type: 'public',
			connection: true,
			wantConn: true,
			lastConn: 0,
			battery: '',
			medsHistory: {},
			version: ''
		}
	var commondType = _data.value.substr(6, 2),
		commondBody = _data.value.substr(8, _data.value.length - 2),
		historyBox = $('ul.allPR').find(`li[data-mac='${mac}'] .center div`)
	console.log('lastCommond %s,commondType %s', lastCommond, commondType)

	if (globalData.lastCommond === 'new') {

		// 读取手环型号
		if (commondType === 'a0') {
			a0f(_data, mac)
		}

		//服药历史
		if (commondType === 'd5') {
			// debugger
			d5.length = 0
			console.log(_data.value)
			d5.push(_data.value)
			console.log(d5)
			globalData.lastCommond = 'd5'

		}
		//读取药方
		if (commondType === 'd3') {
			d3.length = 0
			console.log(_data.value)
			d3.push(_data.value)
			console.log(d3)
			globalData.lastCommond = 'd3'
		}
		//闹钟通知
		if (commondType === 'f1') {
			f1f(mac, commondBody)
		}
		if (commondType === 'dc') {
			dc.length = 0
			dc.push(_data.value)
			globalData.lastCommond = 'dc'
		}

	} else if (globalData.lastCommond === 'd5') {
		if (commondType === 'f0') {
			globalData.lastCommond = 'new'
				// debugger
			d5f(mac, historyBox)
			return
		} else if (commondType === 'd5') {
			console.log('d5 new item')
			d5.push(_data.value)
		} else {
			console.log('d5++')
			console.log(d5)
			d5[length] = d5[length] + _data.value
		}

	} else if (globalData.lastCommond === 'd3') {
		if (commondType === 'f0') {
			globalData.lastCommond = 'new'
			d3f(mac)
			return
		} else if (commondType === 'd3') {
			console.log('d3 new item')
			d3.push(_data.value)
		} else {
			console.log('d3++')
			console.log(d3)
			d3[length] = d3[length] + _data.value
		}
	}



}

function a0f(_data, mac) {
	let version = _data.value.substr(8, 2) === 'c0' ? 'PR1' : _data.value.substr(8, 2) === 'c1' ? 'PR2' : 'PR3'
	globalData.iChoicePR[mac].version = version
	statusAddItem(version, mac)
	syncTime(mac, 25)
	readMed(mac)
	readMeds(mac)
}

function d5f(mac, historyBox) {
	historyBox.empty()
	let medsHistory = globalData.iChoicePR[mac].medsHistory
	globalData.d5.forEach(function(item) {
		let len = parseInt(item.substr(8, 2), 16),
			items = len / 6,
			commondBody = item.substr(10),
			str, alarm, y, m, d, h, min, status, planH, planMin, temp, pack = []
		if (len % 6 !== 0)
			return
		for (let j = 0; j < items; j++) {
			str = commondBody.substr(j * 12, 12)
			pack = []
			for (let k = 0; k < 6; k++) {
				pack.push(parseInt(str.substr(k * 2, 2), 16))
			}
			alarm = pack[0] >> 4
			y = (pack[0] << 2 & 63 | pack[1] >> 6) + 2000
			m = pack[1] >> 2 & 15
			d = (pack[1] & 3) << 3 | pack[2] >> 5
			h = pack[2] & 31
			min = pack[3] >> 2
			status = pack[3] & 3
			planH = pack[4]
			planMin = pack[5]
			if (!medsHistory[`${y}-${m}-${d} ${planH}:${planMin}`]) {
				medsHistory[`${y}-${m}-${d} ${planH}:${planMin}`] = []
			}
			medsHistory[`${y}-${m}-${d} ${planH}:${planMin}`].push({
				status,
				alarm,
				plantime: `${y}-${m}-${d}  ${planH}:${planMin}`,
				realtime: `${h}:${min}`
			})
		}
	})
	for (let i in medsHistory) {
		if (medsHistory[i][1] && medsHistory[i][1].status == 3) {
			if (medsHistory[i][0].status == 2) {
				historyBox.append(`<p>Remind at ${i} taking,finished at ${medsHistory[i][0].realtime}</p>`)
			}
		} else {
			historyBox.append(`<p>Remind time ${i} taking,not finish`)

		}
	}


}

function dcf(mac) {
	let $medBox = $('ul.allPR').find(`li[data-mac='${mac}'] .left div`)
		// debugger
}

function d3f(mac) {
	// debugger
	let $medBox = $('ul.allPR').find(`li[data-mac='${mac}'] .left div`)
	$medBox.empty()

	globalData.d3.forEach(function(item) {
		let date = [parseInt(item.substr(8, 2), 16), parseInt(item.substr(10, 2), 16)],
			allAlrams = item.substr(14),
			alramCount = parseInt(item.substr(12, 2)),
			y, m, d, h, min, colorNum, num, color
		pack = []
		y = (date[0] >> 1) + 2000
		m = date[1] >> 5 | (date[0] << 3 & 8)
		d = date[1] & 31
		for (let j = 0; j < alramCount; j++) {
			pack.push(parseInt(allAlrams.substr(j * 4, 2), 16))
			pack.push(parseInt(allAlrams.substr(j * 4 + 2, 2), 16))
			h = pack[0] >> 3
			min = pack[1] >> 5 | (pack[0] << 3 & 56)
			colorNum = pack[1] & 7
			num = (pack[1] & 24) >> 3
		}
		switch (colorNum) {
			case 1:
				color = 'Red'
				break
			case 2:
				color = 'Green'
				break
			case 3:
				color = 'Blue'
				break
			case 4:
				color = 'Yellow'
			case 5:
				color = 'Purple'
				break

		}
		$medBox.append(`<p>The remind at ${y}-${m}-${d} ${h}:${min} with ${color} color</p>`)


	})

}

function f1f(mac, commondBody) {
	medStatus(mac, commondBody)
	$('ul.allPR').find(`li[data-mac='${mac}'] .left p`).html(commondBody)
}

/**
 * Gets the input data.
 *
 * @return     {Object}  The input data.
 */
function getInputData() {
	return globalData.inputData = {
		// hubIp: $('#hubIp').val().trim(),
		// deviceMac: $('#deviceMac').val().trim(),
		medicine: $('#medicine').val().trim(),
		medTime: $('#medTime').val().trim(),
		color: $('#color').val()
	}
}



/**
 * 验证输入参数
 * @param  {[type]} data [description]
 * @param  {[type]} str hubIp,medicine,medTime
 * @return {[type]}      [description]
 */
function verifyInputData(data, arr) {
	var reg = {
			hubIp: ['^((?:(?:25[0-5]|2[0-4]\\d|((1\\d{2})|([1-9]?\\d)))\\.){3}(?:25[0-5]|2[0-4]\\d|((1\\d{2})|([1-9]?\\d))))$', 'hubIP输入错误'],
			deviceMac: ['^([0-9a-f]{2}:){5}[0-9a-f]{2}$', '设备MAC输入错误'],
			medicines: ['^\\w{1,8}$', '药品名成做多8个英文字符'],
			medTime: ['^\\d{4}-\\d{2}-\\w{5}\\:\\d{2}$', '吃药时间设置错误']
		},
		err = {
			pass: 1
		}
	for (var key of arr) {
		if (!new RegExp(reg[key][0], 'gi').test(data[key])) {
			err[key] = reg[key][1];
			err.pass = 0
		}
	}
	globalData.verifyInputData = err
	return err
}



/**
 * 连接设备
 *
 * @param      {<type>}  data    The data
 */
function connect() {
	// verifyInputData(data);
	globalData.hubIp = $('#hubIp').val().trim()
	verifyInputData(globalData, 'hubIp')
	if (globalData.verifyInputData.hasOwnProperty('hubIp') || globalData.verifyInputData.hasOwnProperty('deviceMac')) {
		console.log('输入参数错误', globalData.verifyInputData)
		alert(JSON.stringify(globalData.verifyInputData, ['hubIp'], 2))
	} else {
		connectDevice(data.hubIp, data.deviceMac,
			'public', [
				writeByHandle.bind(null, data.hubIp, data.deviceMac, [29, 32, 35, 38], '0100'),
				syncTime.bind(null, data.hubIp, data.deviceMac, 25),
				checkConnect.bind(null, data.hubIp, data.deviceMac, 2000),
				holdConnect.bind(null, data.hubIp, data.deviceMac, 25, 'aa5502ced0', globalData.holdTime),
			])
	}
}

function scanPR(reg) {
	let conPR = function(hub, data) {
		if (data === 'keep-alive')
			return
		let _data = JSON.parse(data),
			now = '',
			type = _data.bdaddrs[0].bdaddrType,
			mac = _data.bdaddrs[0].bdaddr,
			deviceinfo = {
				mac: mac,
				type: type,
				connection: false,
				wantConn: false,
				lastConn: 0,
				battery: '',
				medsHistory: {},
			}


		if (globalData.adData.test(_data.adData) && new RegExp('^iChoicePR', 'i').test(_data.name)) {
			if (globalData.iChoicePR[mac]) {
				if (!globalData.iChoicePR[mac].version) {
					globalData.iChoicePR[mac].version = _data.name.substr(-3)
					console.log('%s描到%s,%s', new Date().toLocaleTimeString(), _data.name, mac)
				}
			} else {
				globalData.iChoicePR[mac] = deviceinfo
				globalData.iChoicePR[mac].version = _data.name.substr(-3)
				console.log('%s描到%s,%s', new Date().toLocaleTimeString(), _data.name, mac)
			}

		} else if (_data.scanData && reg.test(_data.scanData)) {
			console.log('%s扫描到要连接的设备%s', new Date().toLocaleTimeString(), mac)
				////////////////////////////////////
				//描到PR在 globalData.connectionPR 中 //
				////////////////////////////////////
			if (globalData.connectionPR[mac]) {
				if (!globalData.iChoicePR[mac]) {
					globalData.iChoicePR[mac] = deviceinfo
					globalData.iChoicePR[mac].wantConn = true
					globalData.iChoicePR[mac].version = ''
				}
				debugger
				delete globalData.connectionPR[mac]
				statusDelItem(mac)
			} else {
				/////////////////////////////////////
				//描到时PR不在globalData.connectionPR 中 //
				/////////////////////////////////////

				/////
				// 不是第一次扫描到PR
				/////
				now = new Date()
				if (globalData.iChoicePR[mac]) {
					globalData.iChoicePR[mac].wantConn = true
					if (!globalData.iChoicePR[mac].connection && now - globalData.iChoicePR[mac].lastConn > 3000) {
						globalData.iChoicePR[mac].lastConn = now
						api.conn({
							type: type,
							node: mac,
							success: function() {
								globalData.iChoicePR[mac].connection = true
								globalData.connectionPR[mac] = {
									mac: mac
								}
								if (!globalData.iChoicePR[mac].version)
									openPRNotify(mac, getPRversion)
								else {
									openPRNotify(mac)
									syncTime(mac, 25)
									readMed(mac)
									readMeds(mac)
									statusAddItem(globalData.iChoicePR[mac].version, mac)
								}
							}
						})
						console.log('%s连接%s', now.toLocaleTimeString(), mac)
					}
				} else {
					//第一次扫描到PR
					globalData.iChoicePR[mac] = deviceinfo
					globalData.iChoicePR[mac].wantConn = true
					globalData.iChoicePR[mac].lastConn = now
					globalData.iChoicePR[mac].version = ''
					api.conn({
						type: type,
						node: mac,
						success: function() {
							globalData.iChoicePR[mac].connection = true
							globalData.connectionPR[mac] = {
								mac: mac
							}
							openPRNotify(mac, getPRversion)
						}
					})
					console.log('%s连接%s', now.toLocaleTimeString(), mac)
				}
			}
		}

	}
	api.on('scan', conPR).scan(0)
}



$('#status').on('click', 'button', function(e) {
	let type = this.dataset.type,
		mac = this.dataset.mac
	if (type === '0') {
		api.conn.close({
			node: mac,
			success: function() {
				statusDelItem(mac)
			}
		})
	} else if (type === '1') {
		$('#status button[data-type="1"]').removeClass('green')
		$('ul.allPR > li>div').css('border', '2px solid black')
		$('ul.allPR').children(`li[data-mac='${mac}']`).children('div').css('border', '2px solid green')
		$(this).addClass('green')
		$('#send').data('mac', mac)
	}
})

function createMdesItem(type, time, time2, name) {
	let _name = name || ''
	let medsitem = `<li>
					<label>
						<span>Medicine</span>
						<input type="text" id="medicine" ${type ? `value=${name}` :'placeholder="less than 8 characters"'} >
						<button data-type='0'>+</button>
					</label>
					<label class="meds-time">
						<span>Remind time</span>
						<input type="datetime-local" id="medTime" ${time?`value=${time}`:''} data-time=${time2}>
						<button data-type='1'>+</button>
						<button data-type='2'>-</button>
					</label>
					<label class="meds-color">
						<span>color</span>
						<select id="color">
							<option value="1" selected>red</option>
							<option value="2">Green</option>
							<option value="3">Blue</option>
							<option value="4">Yellow</option>
							<option value="5">Purple</option>
						</select>
					</label>
				</li>`
	return medsitem
}
function formateTime(now) {
	let _now = ''
	if (now)
		_now = new Date(now)
	else _now = new Date()

	y = _now.getFullYear(),
		m = _now.getMonth() + 1,
		d = _now.getDate(),
		h = _now.getHours(),
		min = _now.getMinutes(),
		str = ''
	m = m < 10 ? '0' + m : m
	d = d < 10 ? '0' + d : d
	h = h < 10 ? '0' + h : h
	min = min < 10 ? '0' + min : min
	str = y + '-' + m + '-' + d + 'T' + h + ':' + min
	return [+_now, str]
}
function Init() {
	let t = formateTime()
	$('#meds-box .top ul li input').eq(1).val(t[1])
	$('#meds-box .top ul li input').eq(1).data('time', +t[0])
}

$('#meds-box').on('click', 'button', function(e) {
	let type = this.dataset.type,
		time = $(this).parents('li').find('input').eq(1).data('time'),
		mac = this.dataset.mac
	let addMin = function(min) {
		let newtime = time + min*60*1000,
		mins = min*60*1000
		return formateTime(newtime)
	}
	if (type === '0') {
		$('#meds-box .top ul').append(createMdesItem(false, addMin(2)[1],addMin(2)[0]))
	} else if (type === '1') {
		let str = $(this).parents('li').find('input').val().trim()
		if (str)
			$('#meds-box .top ul').append(createMdesItem(true, addMin(24*60)[1],addMin(24*60)[0], str))
	} else if (type === '2') {
		$(this).parents('li').remove()
	} else if(type === 'clearMed'){
		clearMed(mac)
	} else if(type ==='clearMeds'){
		clearMeds(mac)
	} else if(type === 'readMed'){
		readMed(mac)
	} else if(type === 'readMeds'){
		readMeds(mac)
	}
})



function sendMedicine(data) {
	var y, mon, day, h, min, d8, d9, d10, d11, temp, commond
	// if (!globalData.connectFlag) {
	// 	alert('未连接设备')
	// 	return
	// }
	
	
		y = data.medTime.substr(0, 4) - 2000
		mon = data.medTime.substr(5, 2)
		day = data.medTime.substr(8, 2)
		h = data.medTime.substr(11, 2)
		min = data.medTime.slice(-2)
		color = data.color
			// y = 16, mon = 12, day = 15, h = 18, min = 11
		// debugger

		temp = mon >> 3
		d8 = y << 1 | temp
			// d8 = d8.toString(16)
			// d8 = '0x' + d8 < 0x10 ? '0' + d8 : d8

		temp = (mon & 7) << 5
		d9 = temp | day
			// d9 = d9.toString(16)

		temp = min >> 3
		d10 = h << 3 | temp

		temp = (min & 7) << 5 | 1 << 3
		d11 = temp | color



		commond = 'AA5511D4008041' + transformToHex([0x11, 0xD4, 0x00, 0x80, 0x41], [d8, d9, d10, d11, 255, 255, 255, 255, 255, 255, 255, 255])
		// writeByHandle(data.hubIp, data.deviceMac, [25], commond)
		api.write({
			node:data.deviceMac,
			handle:25,
			value:commond
		})
		setTimeout(sendMedicineName(data, 1, color), 300)

	


}


/**
 * Sends a medicine name.
 *
 * @param      {<type>}  data    输入数据
 * @param      {<type>}  No      第几个闹钟序列号
 * @param      {number}  color   第几个闹钟的颜色代号  1-5
 */

function sendMedicineName(data, No, color) {
	// debugger
	var data5 = data.medicine.length,
		data6 = 1 << 3 | color,
		temp, commond, data5_19,
		data7 = data.medicine.split('').map(function(item, index, arr) {
			temp = item.charCodeAt(0)
			return temp
				// .toString(16)
				// return '0x' + temp < 0x10 ? '0' + temp : temp
		})
	while (data7.length < 13) {
		data7.push(255)
	}
	// data5= '0x' + data5 < 0x10 ? '0' + data5 : data5
	// data6= '0x' + data6 < 0x10 ? '0' + data6 : data6

	data7.unshift(data5, data6)
	commond = 'AA5511DB' + transformToHex([0x11, 0xDB], data7)
	// writeByHandle(data.hubIp, data.deviceMac, [25], commond)
		api.write({
			node:data.deviceMac,
			handle:25,
			value:commond
		})
}

function transformToHex(data1, data2) {
	var temp,
		hexArr = data2.map(function(item, index) {
			temp = item.toString(16)
			return '0x' + temp < 0x10 ? '0' + temp : temp
		}),
		checkSum = data2.reduce(function(prev, cur, index, arr) {
			return prev + cur
		}) + data1.reduce(function(prev, cur, index, arr) {
			return prev + cur
		})
	checkSum = (checkSum & 0xff).toString(16).toUpperCase()
	return hexArr.join('').toUpperCase() + '' + checkSum

}


function syncTime(deviceMac, handle) {
	// if (!globalData.connectFlag) {
	// 	console.log('设备未连接，设置时间失败')
	// 	return
	// }
	var time = new Date(),
		y = time.getFullYear() - 2000,
		mon = time.getMonth() + 1,
		d = time.getDate(),
		w = time.getDay(),
		h = time.getHours(),
		min = time.getMinutes(),
		s = time.getSeconds(),
		commondBody = transformToHex([0x09, 0xc2], [y, mon, d, w, h, min, s]),
		commond = 'AA5509C2' + commondBody
	// writeByHandle(hubIp, deviceMac, [handle], commond)
	api.write({
		node:deviceMac,
		handle,
		value:commond
	})
}


function readMed( mac) {
	var $ul = $('ul.allPR').find(`li[data-mac='${mac}'] .left div`)
	api.write({
		node:mac,
		handle:25,
		value:'AA5502D3D5'
	})
}

function readMeds( deviceMac) {
	api.write({
		node:deviceMac,
		handle:25,
		value:'AA5502D5D7'
	})
}
function holdConnect(deviceMacobj, handle, value, time) {
	setInterval(function() {
		Object.keys(deviceMacobj).forEach(function(item) {
			api.write({
				node: item,
				handle,
				value
			})
		})
	}, 60 * 1000 * 2)
}


function medStatus(mac,data) {

	var $ul = $('ul.allPR').find(`li[data-mac='${mac}'] .right ul`),
		NO = parseInt(data.substr(0, 2), 16),
		year = parseInt(data.substr(2, 2), 16) + 2000,
		mon = parseInt(data.substr(4, 2), 16),
		day = parseInt(data.substr(6, 2), 16),
		hour = parseInt(data.substr(8, 2), 16),
		min = parseInt(data.substr(10, 2), 16),
		hour2 = parseInt(data.substr(12, 2), 16),
		min2 = parseInt(data.substr(14, 2), 16),
		flag = parseInt(data.substr(16, 2), 16),
		mes = ''
	switch (flag) {
		case 0:
			mes = '第一次提醒忽略'
			break
		case 1:
			mes = '第二次提醒忽略'
			break
		case 2:
			mes = 'taking...'
			break
		case 3:
			mes = `${hour2}:${min2} finished`
			//此处有问题，应该在超时再次读取
			readMeds(mac)
			break
	}
	if(flag ==3){
		$ul.append(`<li>${mes}</li>`)
		return
	}
	$ul.append(`<li>Please take medicine at ${mon}-${day} ${hour2}:${min2}  ${mes}</li>`)

}



/**
 * 清除药方
 *
 * @param      {<type>}  hubIp      The hub ip
 * @param      {<type>}  deviceMac  The device mac
 * @return     {<type>}  { description_of_the_return_value }
 */
function clearMed(mac) {
	api.write({
		node:mac,
		handle:25,
		value:'AA5502D8DA',
		success:function(){
			$('ul.allPR').find(`li[data-mac='${mac}'] .left div`).empty()
			globalData.d3=[]
		}
	})

}

//清除服药历史
function clearMeds(mac) {
	api.write({
		node:mac,
		handle:25,
		value:'AA5502D1D3',
		success:function(){
			$('ul.allPR').find(`li[data-mac='${mac}'] .center div`).empty()
			globalData.iChoicePR[mac].medsHistory={}
		}
	})
}

function getPRMeds(mac){
	api.write({
		node:mac,
		handle:25,
		value:'AA5502DCDE'
	})
}