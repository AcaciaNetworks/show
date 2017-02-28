$(function() {
	var arrUl = $('.show-pannel ul');
	var _url = location.href;
	var imgUrl = `url(http://qr.topscan.com/api.php?&w=300&text=${_url})`
	var url2 = 'http://192.168.1.119:3000'
	url2 = ''

	var lStorage = window.localStorage;

	var	defaultData;
	defaultData = {
		deviceData: '',
		hubMac: ''
	};

	if (lStorage.cassia) {
		defaultData = JSON.parse(lStorage.cassia)
	}


	var te = `<div class="layui-form">
				<div class="layui-form-item">
					<label class="layui-form-label">hubMac</label>
					<div class="layui-input-inline">
						<input type="text" name="hubMac" id="hubMac" placeholder=""   value="" class="layui-input">
					</div>
				</div>
				<div class="layui-form-item">
					<label class="layui-form-label">Server</label>
					<div class="layui-input-inline">
						<input type="text" name="server" id="severIp" placeholder="api1.cassianetworks.com"   value="api1.cassianetworks.com" class="layui-input">
					</div>
				</div>

				<div class="layui-form-item">
					<label class="layui-form-label">Developer</label>
					<div class="layui-input-inline">
						<input type="text" name="developer"  placeholder="tester" value="tester" class="layui-input" id="developer">
					</div>
				</div>
				<div class="layui-form-item">
					<label class="layui-form-label">手环型号</label>
					<div class="layui-input-inline">
						<input type="text" name="device_name" id="device_name"  placeholder="V05" value="V05" class="layui-input">
					</div>
				</div>
				<div class="layui-form-item">
					<label class="layui-form-label">手环uuid</label>
					<div class="layui-input-inline">
						<input type="text" name="service_uuid"   id="service_uuid" class="layui-input">
					</div>
				</div>


				<div class="layui-form-item layui-form-text">
					<label class="layui-form-label mac-css" >mac：使用者</label>
					<div class="layui-input-inline">
						<textarea placeholder="请输入内容" name="mess"  id="mess"   class="layui-textarea"></textarea>
					</div>
				</div>

				<div class="layui-form-item">
					<div class="layui-button">
						<button class="layui-btn" id="finsh" >完成</button>
						<button type="reset" class="layui-btn layui-btn-primary">重置</button>
					</div>
				</div>

			</div>`



	/**
	 * li 标签的模板
	 */
	function sampleTem(obj) {
		return (
			`<li><h2>${obj.name}</h2>
					<p>累计步数 : <span>${obj.stepNumber}</span></p>
					<div class="yellow">
						<img src="./src/img/fire_static.jpg" alt="icon">
						<p><span>${obj.cal}</span>卡</p>
					</div>
					<div class="red">
						<img src="./src/img/heart_staic.jpg" alt="icon">
						<p><span>${obj.heartRate}</span>/s</p>
					</div>
					<div class="blue">
						<img src="./src/img/running_static.jpg" alt="icon">
						<a href="javascript:;" mac=${obj.mac}></a>
						<p><span>${obj.realTime}</span>步</p>
					</div></li>`
		)
	}

	/**
	 * data自动刷新
	 */
	livReflsh()
	var time = setInterval(livReflsh, 1000);

	function livReflsh() {
		$.ajax({
			url: url2 + '/data',
			type: 'GET',
			dataType: 'json',
			timeout: 2000
		}).done(fillData)
	}

	/**
	 * 填充LI标签数据
	 */
	var QRCard = `<li style="background:${imgUrl}" ></li>`;
	var lastLi = '<li> <button class="start">开始训练</button><button class="end">结束训练</button><button class="ansy" disabled="disabled">统计分析</button></li>'
	arrUl.append(QRCard, lastLi);

	function fillData(data) {
		console.log('receiveData:',data)
		var liHtml = ''
		var $li = arrUl.find('li')
		if (arrUl.find('li').length !== data.length + 2) {
			data.forEach(function(item, index, arr) {
				liHtml += sampleTem(item);
			})
			arrUl.html(liHtml).append(QRCard, lastLi);
		} else if (data.length > 0) {
			data.forEach(function(item, index) {
				$li.eq(index).find('h2').text(item.name)
				$li.eq(index).find('.yellow span').text(item.cal)
				$li.eq(index).find('.red span').text(item.heartRate)
				$li.eq(index).find('.blue span').text(item.realTime)
			})
		}

	}



	$('li a').click(function() {
		console.log($(this).attr('mac'))
		clearInterval(time)
		$.ajax({
			url: url2 + '/start',
			type: 'GET',
			data: {
				mac: $(this).attr('mac')
			}
		})
		livReflsh();
		time = setInterval(livReflsh, 1000);
	})

	$('show-pannel')

	$('button.start').click(function() {
		clearInterval(time);

		for (var i = 0; i < showLength; i++) {
			console.log($(arrLi[i]).find('a').attr('mac'))
			$.ajax({
				url: _url2 + '/start',
				type: 'GET',
				data: {
					mac: $(arrLi[i]).find('a').attr('mac')
				}
			})
		}
		livReflsh();
		time = setInterval(livReflsh, 1000);
	})

	/**
	 * 弹出层
	 */

	var layerIndex;
	var objData = {}
	$('#config').click(function() {

		layerIndex = layer.open({
			skin: 'config-layer',
			type: 1,
			title: '配置页',
			moveType: 1,
			area: ['600px', '500px'],
			shadeClose: true, //点击遮罩关闭
			content: te
		});

		if (lStorage.cassia) {
			defaultData = JSON.parse(lStorage.cassia)
		}

		console.log()
		$('#mess').text(
			defaultData.deviceData)

		$('#hubMac').attr({
			value: defaultData.hubMac
		})
		$('#finsh').click(function() {

			var t = 'ec:23:de:90:we,网;ec:23:de:90:we,1网;ec:23:de:90:we,2网;ec:23:de:90:we,3网'
			var deviceData = $('#mess').val();


			var deviceArr = deviceData.split(';');
			var temp = [];
			var macDataItem = {};

			for (var i = 0; i < deviceArr.length; i++) {
				temp = (deviceArr[i]).split(',');
				macDataItem[temp[0]] = temp[1];

			}
			objData = {

				'hubMac': $('#hubMac').val(),
				'server': $('#severIp').val(),
				'developer': $('#developer').val(),
				'device_name': $('#device_name').val(),
				'service_uuid': $('#service_uuid').val(),
				'device': macDataItem
			}

			lStorage.cassia = JSON.stringify({
				deviceData: deviceData,
				hubMac: objData.hubMac
			})
			layer.close(layerIndex)

			return false;
		})



	})


	$('#startWork').click(function() {
		var t = 'ec:23:de:90:we,网;ec:23:de:90:we,1网;ec:23:de:90:we,2网;ec:23:de:90:we,3网'
		var deviceData = $('#mess').val();
		var deviceArr = t.split(';');
		var temp = [];
		var macDataItem = {};
		var macData = []
		for (var i = 0; i < deviceArr.length; i++) {
			temp = (deviceArr[i]).split(',');
			macDataItem[temp[0]] = temp[1];
			macData.push(macDataItem)
		}
		console.log(objData)
		$.ajax({
			url: url2 + '/hub/start',
			type: 'POST',
			data: objData

		})
	})



})
