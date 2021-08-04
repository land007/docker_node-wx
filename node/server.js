const WXBizMsgCrypt = require('wxcrypt');
const { o2x,x2o } = require('wxcrypt');
const token = process.env['TOKEN'] || 'nUoBqY2r';
const encodingAESKey = process.env['ENCODING_AES_KEY'] || 'CmRHvvA95oRdJutpROpuuC2HuRLCRQQLHDbkQPvemyP';
const appid = process.env['APPID'] || 'BwdOH8TGkYnTmeWvoQ';
var weixin = new WXBizMsgCrypt(token, encodingAESKey, appid);
var cors = require('cors');
var express = require('express');
var app = express();
var router = express.Router();
//const bodyParser = require('body-parser');
//app.use(bodyParser.urlencoded({ extended: false }));
//app.use(bodyParser.json());
//app.use(bodyParser.raw());
router.use (function(req, res, next) {
  var data='';
  req.setEncoding('binary');
  req.on('data', function(chunk) {
    data += chunk;
  });
  req.on('end', function() {
    req.body = data;
    next();
  });
});
app.use("/weixin", router);
//ENABLE CORS
app.use(cors());
var http = require('http').Server(app);
var io = require('socket.io')(http, {
//  cors: {
//    origin: "http://192.168.1.124",
//    methods: ["GET", "POST"]
//  }
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
var httpProxy = require('http-proxy');

//新建一个代理 Proxy Server 对象
var proxy = httpProxy.createProxyServer({});
//捕获异常
proxy.on('error',
	function(err, req, res) {
		res.writeHead(500, {
			'Content-Type' : 'text/plain'
		});
		res.end('Something went wrong. And we are reporting a custom error message.');
	});
app.get('/eye/*', function(req, res){
	// 在这里可以自定义你的路由分发
	var host = req.headers.host, ip = req.headers['x-forwarded-for']
			|| req.connection.remoteAddress;
	console.log("client ip:" + ip + ", host:" + host);
	switch (host) {
	case 'solr.qhkly.com':
	case 'neo4j.qhkly.com':
		proxy.web(req, res, {
			target : 'http://192.168.0.96:8008/eye/'
		});
		break;
	default:
		res.writeHead(200, {
			'Content-Type' : 'text/plain'
		});
		res.end('Welcome to my server!');
	}
});
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
app.get('/weixin', function(req, res){
    console.log('get /weixin');
    //console.log('get /weixin', req);
    var msg_signature = req.query.msg_signature;
    console.log('msg_signature', msg_signature);
    var timestamp = req.query.timestamp;
    console.log('timestamp', timestamp);
    var nonce = req.query.nonce;
    console.log('nonce', nonce);
    var echostr = req.body;
    console.log('echostr', echostr);
    var demsg = weixin.verifyURL(msg_signature, timestamp, nonce, echostr);
    console.log('demsg', demsg);
    res.end(demsg);
});
app.post('/weixin', function(req, res){
    console.log('post /weixin');
    //console.log('post /weixin', req);
    var msg_signature = req.query.msg_signature;
    console.log('msg_signature', msg_signature);
    var timestamp = req.query.timestamp;
    console.log('timestamp', timestamp);
    var nonce = req.query.nonce;
    console.log('nonce', nonce);
    var postData = req.body;
    console.log('postData', postData);
    var demsg = weixin.decryptMsg(msg_signature, timestamp, nonce, postData);
    console.log('demsg', demsg);
    var jxml = x2o(demsg);
    console.log('jxml', jxml);
    if(jxml && jxml.xml && jxml.xml.TaskId && jxml.xml.EventKey) {
        io.sockets.in(jxml.xml.TaskId).emit('event_name', jxml.xml.EventKey);
    }
    res.end(JSON.stringify('jxml'));

});

io.on('connection', function(socket){
  console.log('a user connected');
  socket.emit('get room');
  socket.on('subscribe', function(data) {
	  console.log('subscribe ' + data.room);
	  socket.join(data.room);
  });
  socket.on('unsubscribe', function(data) {
      console.log('unsubscribe ' + data.room);
      socket.leave(data.room);
  });
  socket.on('disconnect', function(){
	  console.log('user disconnected');
  });
  socket.on('chat message', function(msg){
//	  //给除了自己以外的客户端广播消息
//	  socket.broadcast.emit("msg",{data:"hello,everyone"});
//	  //给所有客户端广播消息
//	  io.sockets.emit("msg",{data:"hello,all"});
//	  //不包括自己
//	  socket.broadcast.to('group1').emit('event_name', data);
//	  //包括自己
//	  io.sockets.in('group1').emit('event_name', data);
//	  //获取所有房间（分组）信息
//	  io.sockets.manager.rooms
//	  //获取此socketid进入的房间信息
//	  io.sockets.manager.roomClients[socket.id]
//	  //获取particular room中的客户端，返回所有在此房间的socket实例
//	  io.sockets.clients('particular room')
	  //给自己所在的rooms发消息
	  for(var room of socket.rooms) {
		  if(room != socket.id){
              console.log('room', room, 'msg', msg);
			  io.to(room).emit('chat message', msg);
		  }
	  }
	  //socket.join('cached');
//	  console.log(JSON.stringify(socket.rooms));
//	  io.emit('chat message', msg);
  });
});

http.listen(80, function(){
  console.log('listening on *:80');
});