var fs = require('fs');
var http = require('http');
var server = http.createServer();
var express = require('express')
var app = express();
app.use(express.static(__dirname + '/'));
var server = http.createServer(app);

var io = require('socket.io').listen(server);
server.listen(8000);

var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var msUserCollection = null;
var trJinroCollection = null;
var trShokeiCollection = null;
MongoClient.connect("mongodb://127.0.0.1:27017/", function(err, db) {
	if (err) throw err;
	var dbo = db.db("qcJinro");
	msUserCollection = dbo.collection("msUser");
	trJinroCollection = dbo.collection("trJinroCollection");
	trShokeiCollection = dbo.collection("trShokeiCollection");
});

var MAX_MESSAGES_SIZE = 30;
var data = {
	messages : []
};
var gameStatus = null;
io.sockets.on("connection", function(socket) {
	socket.on("createPlayerId", createUserId);
	socket.on("addGame", addGame);
});
// ----------------------------------------------------------------------
// プレイヤーIDを生成.
// ----------------------------------------------------------------------
function createPlayerId(params, callback) {
	var playerId = generateUuid();
	callback(playerId);
}
// ----------------------------------------------------------------------
// ゲームに参加.
// ----------------------------------------------------------------------
function addGame(params, callback) {
}
// ----------------------------------------------------------------------
// UUID生成.
// ----------------------------------------------------------------------
function generateUuid() {
    let chars = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".split("");
    for (let i = 0, len = chars.length; i < len; i++) {
        switch (chars[i]) {
            case "x":
                chars[i] = Math.floor(Math.random() * 16).toString(16);
                break;
            case "y":
                chars[i] = (Math.floor(Math.random() * 4) + 8).toString(16);
                break;
        }
    }
    return chars.join("");
};
//----------------------------------------------------------------------
// 配列をシャッフルする.
//----------------------------------------------------------------------
function arrayShuffle(array) {
	for (var i = array.length - 1; i > 0; i--) {
		var r = Math.floor(Math.random() * (i + 1));
		var tmp = array[i];
		array[i] = array[r];
		array[r] = tmp;
	}
}
// ----------------------------------------------------------------------
// 現在の日時を取得する.
// ----------------------------------------------------------------------
function getDateTime() {
	var now = new Date();
	var year = now.getFullYear();
	var month = now.getMonth() + 1;
	var day = now.getDate();
	var hour = now.getHours();
	var minute = now.getMinutes();
	var second = now.getSeconds();
	return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":"
			+ second;
}
// ----------------------------------------------------------------------
// 現在の日時を取得する（ログ用）.
// ----------------------------------------------------------------------
function getDateTimeForLog() {
	return "[" + getDateTime() + "] ";
}
