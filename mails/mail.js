var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var co = require('co');
var url = [];
var timer;
var timeNAN;
var myreg = /([0-9A-Za-z\-_\.]+)@([0-9a-z]+\.[a-z]{2,3}(\.[a-z]{2})?)/;
//var myreg = /^[a-z0-9]+([._\\-]*[a-z0-9])*@([a-z0-9]+[-a-z0-9]*[a-z0-9]+.){1,63}[a-z0-9]+$/;
fs.readFile('./companyUrl.csv','utf-8',function(err,data){  
    if(err){  
        console.log("read err:"+data);  
    }else{  
    	console.log(data)
      url = data.split("|\n");
    //  url = ["http://www.ait-china.com"]
      co(function*(){
      	try {
      	for(var i = 0,len = url.length-1;i<len;i++){
      		yield getcompanyData(i);
      	}				
      	} catch(e) {
      		console.log(e);
      	}
      }); 
    }  
});
function getcompanyData(i){
	return new Promise(function(resolve, reject) {
		var arr = [];
		var mail = '';

		if(url[i] != 'undefined'){
			try{
					// process.on('uncaughtException', function (err) {
					// 	clearTimeout(timeNAN);
					// 	mail = (i/1+1)+'null';
					// 	arr.push([mail]); 
					// 	fs.appendFile('./new/getCompanyData.csv',arr.join('\n') + '\n', function () {
					// 	  	console.log('追加内容完成'+'----------->>>>>'+(i/1+1)+"-------->>"+mail);
					// 		clearTimeout(timeNAN);
					// 	  	resolve() ;
					// 	});
					// 	console.log(err+"aaaaaaaaaaaaaa");
					// });
					// timeNAN = setTimeout(function(){
					// 		abcdefg;
					// },3000);
				
				request.get(url[i], {timeout: 12000}).on('response',function (res) {
					console.log(res.statusCode+"-------->>>i");
					// setTimeout(function() {
					// 	res.destroyed || res.destroy()
					// 	coonsole.log('mei cuo')
					// }, 2000)
					var html = '';
				    res.on('data',function(data){
				    	html += data;
				    });
				    res.on('end', function () {
				    	console.log('e-----n-----d');
				    	try {
				    		// var $ = cheerio.load(html); //采用cheerio模块解析html
				   //      	$("body").find('*').each(function(){
				   //  		//	console.log('in each',arguments[0])
					  //       	var txt = $(this).text().trim();
					  //   		if(myreg.test(txt)){
					  //   			mail = (i/1+1)+txt;
					  //   			return false;
					  //   		}else{
					  //   			mail = (i/1+1)+'null';
					  //   		}
							// }); 
							console.time('reg')
							var ret = myreg.exec(html)
							  mail = ret && ret[0]
							console.timeEnd('reg');
							arr.push([mail]); 
							fs.appendFile('./new/getCompanyData.csv',arr.join('\n') + '\n', function () {
							  	console.log('追加内容完成'+'----------->>>>>'+(i/1+1)+"-------->>"+mail);
								clearTimeout(timeNAN);
							  	resolve();
							});
							  
				    	}catch(e) {
				    		console.log("end----->>exception" + e);
				    		mail = (i/1+1)+'null';
				    		arr.push([mail]); 
				    		fs.appendFile('./new/getCompanyData.csv',arr.join('\n') + '\n', function () {
				    		 	console.log('追加内容完成'+'----------->>>>>'+(i/1+1)+"-------->>"+mail);
				    		 	clearTimeout(timeNAN);
				    		  	resolve() ;
				    		});
				    	}
					});
					res.on('err',function(e){
						mail = (i/1+1)+'null';
						arr.push([mail]); 
						fs.appendFile('./new/getCompanyData.csv',arr.join('\n') + '\n', function () {
					  		console.log('追加内容完成'+'---------->>>>>'+(i/1+1)+"-------->>"+mail);
					  		clearTimeout(timeNAN);
					  		resolve();
						});
					});
				}).on('error', function(e) {
					mail = (i/1+1)+'null';
					arr.push([mail]); 
				    fs.appendFile('./new/getCompanyData.csv',arr.join('\n') + '\n', function () {
				  		console.log('追加内容完成'+'------------->>>>>'+(i/1+1)+"-------->>"+mail);
				  		clearTimeout(timeNAN);
				  		resolve(e) ;
					}); 
				})
			}catch(e){
				console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
					mail = (i/1+1)+'null';
					arr.push([mail]); 
				    fs.appendFile('./new/getCompanyData.csv',arr.join('\n') + '\n', function () {
				  		console.log('追加内容完成'+'------------->>>>>'+(i/1+1)+"-------->>"+mail);
				  		clearTimeout(timeNAN);
				  		resolve(e) ;
					}); 
			}
			
		}else{
			mail = (i/1+1)+"null"
			arr.push([mail]); 
		    fs.appendFile('./new/getCompanyData.csv',arr.join('\n') + '\n', function () {
		  		console.log('追加内容完成'+'------------->>>>>'+(i/1+1)+"-------->>"+mail);
		  		clearTimeout(timer);
		  		clearTimeout(timeNAN);
		  		resolve();
			});
		}
	});
	
}