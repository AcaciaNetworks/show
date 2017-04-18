var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var co = require('co');
var url = [];
 
var myreg = /^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/;
fs.readFile('./companyUrl.csv','utf-8',function(err,data){  
    if(err){  
        console.log(data);  
    }else{  
      url = data.split("|\r\n");
      console.log(url);
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
		var telPhone = ''
		if(url[i] != 'undefined'){
			console.log(`======`, url[i])
			request.get(url[i]).on('response',function (res) {
				var html = '';
			    res.on('data',function(data){
			    	html += data;
			    });
			    res.on('end', function () {
			        var $ = cheerio.load(html); //采用cheerio模块解析html
			        $("body").find('*').each(function(){
			        	var txt = $(this).text().trim();
			    		if(myreg.test(txt)){
			    			mail = txt;
			    			console.log(mail);
			    			return false;
			    		}else{
			    			mail = 'null'
			    		}
					}); 
					arr.push([mail]); 
				    fs.appendFile('./getCompanyData.csv',arr.join('\n') + '\n', function () {
				  		console.log('追加内容完成'+'----------->>>>>'+i+"-------->>"+mail);
				  		resolve() ;
					});
				});
				res.on('err',function(e){
					mail = 'null'
					arr.push([mail]); 
					fs.appendFile('./getCompanyData.csv',arr.join('\n') + '\n', function () {
				  		console.log('追加内容完成'+'---------->>>>>'+i+"-------->>"+mail);
				  		resolve() ;
					});
				});
			}).on('error', function(e) {
				mail = 'null'
				arr.push([mail]); 
			    fs.appendFile('./getCompanyData.csv',arr.join('\n') + '\n', function () {
			  		console.log('追加内容完成'+'------------->>>>>'+i+"-------->>"+mail);
			  		resolve(e) ;
				}); 
			});
		}else{
			mail = "null"
			arr.push([mail]); 
		    fs.appendFile('./getCompanyData.csv',arr.join('\n') + '\n', function () {
		  		console.log('追加内容完成'+'------------->>>>>'+i+"-------->>"+mail);
		  		resolve() ;
			});
		}
	});
	
}