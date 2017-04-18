var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var co = require('co');

var baseUrl = 'https://www.bluetooth.com/membership-working-groups/member-directory?hits=40&page=';
var sta = 726,end = 796;

function getcompany(s){
	return new Promise(function(resolve, reject) {
		var arr = [];
		request.get(baseUrl+s).on('response',function (res) {
			var html = '';
		    res.on('data',function(data){
		    	html += data;
		    });
		    res.on('end', function () {
		        var $ = cheerio.load(html); //采用cheerio模块解析html
		        $(".interior-table tbody tr").each(function(){
		    		var companyName = $(this).find("td").eq(0).text().trim();
		    		var memberLevel = $(this).find("td").eq(1).text().trim();
		    		var companyUrl = $(this).find('td a').attr('href');
		    		if(companyName.indexOf(",") >= 0){
		    			companyName = companyName.replace(","," ");
		    		}
		    		if(companyName.indexOf(",") >= 0){
		    			companyName = companyName.replace(","," ");
		    		}
		    			companyUrl += '|';
		    		arr.push([companyName,companyUrl,memberLevel]);      
				}); 
			    fs.appendFile('D:/test/companyData.csv',arr.join('\n') + '\n', function () {
			  		console.log('追加内容完成'+'------------->>>>>'+s+"-------->>"+arr.length);
			  		resolve() ;
				});
			});
			res.on('err',function(e){
				console.log(e);
				reject(e);
				sta = sta -1;
	
			});
		}).on('error', function(e) {
			reject(e);
		});
	});
	
}
co(function*(){
	try {
	for(;sta <= end; sta++) {
		yield getcompany(sta);
	}				
	} catch(e) {
		console.log(e);
	}
});






// var interval =setInterval(function(){
// 	debugger
// 	getcompany(sta);
// 	sta++;
// },5000)






/*
const array = Array(5).fill('').map((item, index) => {
    return 'https://bluetooth.com/membership-working-groups/member-directory?hits=40&page=' + (index + 1);
});
const fetch = require('node-fetch');
const fs = require('fs');
const filePath = './demo.csv';
const cheerio = require('cheerio');

const fn = function (array, callback) {
    console.log('剩余',array.length);
    let item = array.shift();
    if (!item) {
        return callback(null, true);
    }
    fetch(item).then((res) => {
        return res.text();
    }).then((text) => {
        let $ = cheerio.load(text);
        let result = [];
        $('.interior-table tbody tr').each(function () {
            let companyName = $(this).find('td').eq(0).text().trim();
            let companyUrl = $(this).find('td a').attr('href');
            result.push([companyName, companyUrl].join(','));
        });
        fs.appendFileSync(filePath, result.join('\r\n'));
        fn(array, callback);
    })
}


fn(array, console.log);
*/

//--------------------------- 爬网页内的信息  e-mail ... ----------------------------
		    		// if(typeof(companyUrl) !== undefined){
		    		// 	request.get(companyUrl).on('response',function(res){

		    		// 		var htmlIn = '';
		    		// 		res.on('data',function(data){
		    		// 			htmlIn += data;
		    		// 		});
		    		// 		res.on('end',function(){
		    					
		    		// 			var $ = cheerio.load(htmlIn);
		    		// 			try{
		    		// 				companyMail = $('body:contains("@")').text();
		    		// 				console.log('www')
		    		// 			}catch(e){
		    		// 				companyMail = '';
		    		// 			}
		    					
		    		// 		});
		    		// 		res.on('err',function(e){
		    		// 			console.log(e);
		    		// 			companyMail = '';
		    		// 		});


		    		// 	}).on('err',function(e){
		    		// 		console.log(e);
		    		// 		companyMail = '';
		    		// 	});

		    		// }
//----------------------------------------------------------------------------------------
// co(function*(){
//  	try{
//  		for(var i = 0,len = trs.length;i < len;i++){
//  			yield function(){
//      			var companyName = trs[i].find("td").eq(0).text().trim();
//      			var memberLevel = trs[i].find("td").eq(1).text().trim();
//      			var companyUrl = trs[i].find('td a').attr('href');
//      			if(companyName.indexOf(",") >= 0){
//      				companyName = companyName.replace(","," ");
//      			}
// //--------------------------- 爬网页内的信息  e-mail ... ----------------------------
//      			if(typeof(companyUrl) !== undefined){
//      				request.get(companyUrl).on('response',function(res){
//      					var htmlIn = '';
//      					res.on('data',function(data){
//      						htmlIn += data;
//      					});
//      					res.on('end',function(){
//      						var $ = cheerio.load(htmlIn);
//      						try{
//      							$('body').find('*').each(function(){
//      								console.log($(this).text());
//      							});
//      						}catch(e){companyMail = '';}
//      					});
//      					res.on('err',function(e){
//      						console.log(e);
//      						companyMail = '';
//      					});
//      				}).on('err',function(e){
//      					console.log(e);
//      					companyMail = '';
//      				});
//      			}
// //----------------------------------------------------------------------------------------		         			
//  			};
//  		}
//  	}catch(e){console.log(e);}
// 		arr.push([companyName,companyUrl,memberLevel,companyMail]);  
// 	    fs.appendFile('D:/test/companyData.csv',arr.join('\n') + '\n', function () {
// 	  		console.log('追加内容完成'+'------------->>>>>'+s+"-------->>"+arr.length);
// 	  		resolve() ;
// 		});
// });