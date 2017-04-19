var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var co = require('co');
var url = [];
var timer;
var myreg = /^[a-z0-9]+([._\\-]*[a-z0-9])*@([a-z0-9]+[-a-z0-9]*[a-z0-9]+.){1,63}[a-z0-9]+$/;
fs.readFile('./companyUrl.csv','utf-8',function(err,data){  
    if(err){  
        console.log("read err:"+data);  
    }else{  
      url = data.split("|\n");
     // url = ["http://3dsoundlabs.com/"]
      co(function*(){
      	try {
      	for(var i = 0,len = url.length - 1;i<len;i++){
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
			request.get(url[i]).on('response',function (res) {
			timer = setTimeout(function(){
					console.log('destroy')
					res.destroy();
				},12000);
				console.log(res.statusCode+"-------->>>i");
				var html = '';
			    res.on('data',function(data){
			    	html += data;
			    });
			    res.on('end', function () {
			    	console.log('endendendend')
			    	try {
			    		var $ = cheerio.load(html); //采用cheerio模块解析html
			        	$("body").find('*').each(function(){
			    		//	console.log('in each',arguments[0])
				        	var txt = $(this).text().trim();
				    		if(myreg.test(txt)){
				    			mail = (i/1+1)+txt;
				    			return false;
				    		}else{
				    			mail = (i/1+1)+'null';
				    		}
						}); 
						  /*var ret = myreg.exec(html)
						  mail = ret && ret[0]*/
						// console.log(html)
						arr.push([mail]); 
			    	}catch(e) {
			    		console.log(e)
			    	}
				    fs.appendFile('./new/getCompanyData.csv',arr.join('\n') + '\n', function () {
				  		console.log('追加内容完成'+'----------->>>>>'+(i/1+1)+"-------->>"+mail);
				  		resolve() ;
					});
				});
				res.on('err',function(e){
					mail = (i/1+1)+'null';
					arr.push([mail]); 
					fs.appendFile('./new/getCompanyData.csv',arr.join('\n') + '\n', function () {
				  		console.log('追加内容完成'+'---------->>>>>'+(i/1+1)+"-------->>"+mail);
				  		clearTimeout(timer);
				  		resolve();
					});
				});
			}).on('error', function(e) {
				mail = (i/1+1)+'null';
				arr.push([mail]); 
			    fs.appendFile('./new/getCompanyData.csv',arr.join('\n') + '\n', function () {
			  		console.log('追加内容完成'+'------------->>>>>'+(i/1+1)+"-------->>"+mail);
			  		clearTimeout(timer);
			  		resolve(e) ;
				}); 
			})
		}else{
			mail = (i/1+1)+"null"
			arr.push([mail]); 
		    fs.appendFile('./new/getCompanyData.csv',arr.join('\n') + '\n', function () {
		  		console.log('追加内容完成'+'------------->>>>>'+(i/1+1)+"-------->>"+mail);
		  		clearTimeout(timer);
		  		resolve();
			});
		}
	});
	
}