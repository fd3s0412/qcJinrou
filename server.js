var fs = require('fs');
var http = require('http');
var server = http.createServer();
var express = require('express')
var app = express();
app.use(express.static(__dirname + '/'));
var server = http.createServer(app);

var io = require('socket.io').listen(server);
server.listen(8006);

var Player = require('./js/player.js');

var MAX_MESSAGES_SIZE = 30;
var data = {
	messages : []
};
// ゲームインフォオブジェクト（{String} status: ゲーム中か否か, {Integer} day: ターン数, {String} gameTime: 朝か夕方か夜か）
var gameInfo = {};
// プレイヤーマップ（プレイヤーIDをキーにしたプレイヤークラス格納マップ）
var playerMap = {};
var sankashaList = [];

// 人狼勝利フラグ
var ookamiVictory = false;
// 村人勝利フラグ
var murabitoVictory = false;
// ----------------------------------------------------------------------
// 定期サーバー処理.
// ----------------------------------------------------------------------
setInterval(function() {
	// ゲーム情報をクライアントで描画する
	sendGameInfo(gameInfo, sankashaList);
	// 全員の行動が完了するまで待機
	if (gameInfo.gameTime === "夜" 
			&& !existsKodoMikanryo(sankashaList)
	) {
		console.log("夜");
		// 処刑者発表
		// 勝利判定
		isWinJinro(sankashaList);
		// 夜の行動
		for (var i = 0; i < sankashaList.length; i++) {
			var d = sankashaList[i];
			d.doNight(gameInfo.day);
		}
		gameInfo.gameTime = "朝";
	}
	// 全員の行動が完了するまで待機
	else if (gameInfo.gameTime === "朝"
			&& !existsKodoMikanryo(sankashaList)
	) {
		console.log("朝");
		gameInfo.day++;
		// 人狼の被害者発表
		// ゲーム終了チェック
		// 朝の行動
		for (var i = 0; i < sankashaList.length; i++) {
			var d = sankashaList[i];
			d.doMorning(gameInfo.day);
		}
		gameInfo.gameTime = "夜";
	}
	
//	if (ookamiVictory === true) {
//		var victoryMessege = "狼陣営の勝利だ！！満腹満腹(^_^)";
//		var loserMessege = "村人陣営の敗北だ...食わないでくれ～(T.T)";
//	} else if (murabitoVictory === true) {
//		var victoryMessege = "村人陣営の勝利だ！！人間の力を思い知ったか！(-o-)";
//		var loserMessege = "狼陣営の敗北だ...へんじがない、ただのしかばねのようだ。";
//	}
	// debug:
	//clearInterval(gameLoop);
}, 500);
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
function addGame(params, callback, io, socket) {
	playerMap[params.playerId] = new Player(params.playerId, params.userName, io, socket);
	playerMap[params.playerId].setSocketId(socket.id);
	setImage(playerMap[params.playerId]);
	//console.log(playerMap[params.playerId]);
	// 参加者
	sankashaList = getSankashaList(playerMap);
	console.log("add game: " + params.playerId);
}
// ----------------------------------------------------------------------
// 画像ファイル名を取得.
// ----------------------------------------------------------------------
function setImage(player) {
	fs.readdir('./image/', function(err, fileList){
		//console.log(fileList);
		arrayShuffle(fileList);
		var imageName = fileList[0];
		player.setImage(imageName);
	});
	
}
// ----------------------------------------------------------------------
// コネクション情報を設定.
// ----------------------------------------------------------------------
function updateSocketId(playerId, socket) {
	if (playerMap[playerId]) {
		playerMap[playerId].setSocketId(socket.id);
		console.log("setSocketId: " + playerId + ", " + socket.id);
	} else {
		console.log("not added game: " + playerId);
	}
}
// ----------------------------------------------------------------------
// ゲームスタート.
// ----------------------------------------------------------------------
function startGame(params) {
	// ゲーム情報のステータスをゲーム中に更新
	gameInfo.status = "ゲーム中";
	console.log(gameInfo);
	// 参加者
	sankashaList = getSankashaList(playerMap);
	// 役職割振り
	setYakushoku(sankashaList);
	// 準備完了状態のプレイヤーにゲーム開始共通処理を実施
	for (var i = 0; i < sankashaList.length; i++) {
		sankashaList[i].setDefault();
	}
	// 0日目の夜からスタート
	gameInfo.day = 0;
	gameInfo.gameTime = "夜";
}
// ----------------------------------------------------------------------
// ゲーム情報をクライアントに送信.
// ----------------------------------------------------------------------
function sendGameInfo(gameInfo, sankashaList) {
	for (var i = 0; i < sankashaList.length; i++) {
		var sankasha = sankashaList[i];
		io.to(sankasha.socketId).emit('showGameInfo', {
			gameInfo: gameInfo,
			sankashaList: Player.convertToSend(sankashaList),
			playerInfo: {message: sankasha.message}
		});
	}
}
// ----------------------------------------------------------------------
// 参加者リストを返す.
// ----------------------------------------------------------------------
function getSankashaList(playerMap) {
	var sankashaList = [];
	var keys = Object.keys(playerMap);
	for (var i = 0; i < keys.length; i++) {
		var d = keys[i];
		var player = playerMap[d];
		if (player.isReadyToStart === true) {
			sankashaList.push(player);
		}
	}
	return sankashaList;
}
// ----------------------------------------------------------------------
// 役職割振.
// ----------------------------------------------------------------------
function setYakushoku(playerList) {
	var yakushokuList = ["狂人", "占い師", "霊媒師", "狩人"];
	yakushokuList = addJinro(yakushokuList, playerList.length);
	yakushokuList = addMurabito(yakushokuList, playerList.length);
	arrayShuffle(playerList);
	arrayShuffle(yakushokuList);
	for (var i = 0; i < playerList.length; i++) {
		var entity = playerList[i];
		var yakushoku = yakushokuList[i];
		entity.setYakushoku(yakushoku);
	}
}
// ----------------------------------------------------------------------
// 人数に応じて人狼を追加.
// ----------------------------------------------------------------------
function addJinro(yakushokuList, sankashaNinzu) {
	yakushokuList.push("人狼");
	for (var i = 0; i < sankashaNinzu / 7; i++) {
		yakushokuList.push("人狼");
	}
	return yakushokuList;
}
// ----------------------------------------------------------------------
// 人数に応じて村人を追加.
// ----------------------------------------------------------------------
function addMurabito(yakushokuList, sankashaNinzu) {
	for (var i = 0; i < sankashaNinzu; i++) {
		yakushokuList.push("村人");
	}
	return yakushokuList;
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
	return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
}
// ----------------------------------------------------------------------
// 現在の日時を取得する（ログ用）.
// ----------------------------------------------------------------------
function getDateTimeForLog() {
	return "[" + getDateTime() + "] ";
}
//----------------------------------------------------------------------
// 行動未完了存在判定.
//----------------------------------------------------------------------
function existsKodoMikanryo(sankashaList) {
	for (var i = 0; i < sankashaList.length; i++) {
		var entity = sankashaList[i];
		if (entity.isLive === true && entity.canSelectPlayer) {
			return true
		}
	}
	return false;
}
//----------------------------------------------------------------------
// 終了判定.
//----------------------------------------------------------------------
function isWinJinro(sankashaList) {
	var jinrouCount = 0;
	var muraCount = 0;
	for (var i = 0; i < sankashaList.length; i++) {
		var entity = sankashaList[i];
		if (entity.isLive === true) {
			if (entity.yakushoku === "人狼") {
				jinrouCount++;
			} else {
				muraCount++;
			}
		}
	}
	if (jinrouCount >= muraCount) {
		return true;
	}
	return false;
}
// ----------------------------------------------------------------------
// 接続処理.
// ----------------------------------------------------------------------
io.sockets.on("connection", function(socket) {
		socket.on("createPlayerId", createPlayerId);
	socket.on("addGame", function(params, callback) {
		addGame(params, callback, io, socket);
	});
	// 渡されたUUIDとsocketIdを紐づける
	socket.on("updateSocketId", function(playerId) {
		updateSocketId(playerId, socket);
	});
	socket.on("startGame", startGame);
});
