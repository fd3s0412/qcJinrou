var fs = require('fs');
var http = require('http');
var server = http.createServer();
var express = require('express')
var app = express();
app.use(express.static(__dirname + '/'));
var server = http.createServer(app);

var io = require('socket.io').listen(server);
server.listen(8000);

var Player = require('./js/player.js');

var MAX_MESSAGES_SIZE = 30;
var data = {
	messages : []
};
var gameInfo = {};
var playerMap = {};

// 人狼勝利フラグ
var ookamiVictory = false;
// 村人勝利フラグ
var murabitoVictory = false;

// 勝利メッセージ
var victoryMessege;
// 敗北メッセージ
var loserMessege;
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
	console.log("add game: " + params.playerId);
}
// ----------------------------------------------------------------------
// コネクション情報を設定.
// ----------------------------------------------------------------------
function setSocketId(playerId) {
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
	var sankashaList = getSankashaList(playerMap);
	// 役職割振り
	setYakushoku(sankashaList);
	// 準備完了状態のプレイヤーにゲーム開始共通処理を実施
	for (var i = 0; i < sankashaList.length; i++) {
		sankashaList[i].setDefault();
	}
	// 0日目の夜からスタート
	gameInfo.day = 0;
	gameInfo.gameTime = "夜";
	var gameLoop = setInterval(function() {
		// 全員の行動が完了するまで待機
		if (gameInfo.gameTime === "夜" 
		//&&!existsKodoMikanryo(sankashaList)
		) {
			// 処刑者発表
			// 勝利判定
			gameSet(sankashaList);
			if (ookamiVictory === false && murabitoVictory === false) {
			// 夜の行動
			$.each(sankashaList, function(i, d) {
				d.doNight(gameInfo.day);
			});
			gameInfo.gameTime = "朝";
			
			}
		}
		// 全員の行動が完了するまで待機
		if (gameInfo.gameTime === "朝" &&
				!existsKodoMikanryo(sankashaList)) {
			gameInfo.day++;
			// 人狼の被害者発表
			// ゲーム終了チェック
			// 朝の行動
			$.each(sankashaList, function(i, d) {
				d.doMorning(gameInfo.day);
			});
			gameInfo.gameTime = "夜";
		}
		
		if (ookamiVictory === true) {
			victoryMessege = "狼陣営の勝利だ！！満腹満腹(^_^)";
			loserMessege = "村人陣営の敗北だ...食わないでくれ～(T.T)";
		} else if (murabitoVictory === true) {
			victoryMessege = "村人陣営の勝利だ！！人間の力を思い知ったか！(-o-)";
			loserMessege = "狼陣営の敗北だ...へんじがない、ただのしかばねのようだ。";
		}
		// debug:
		clearInterval(gameLoop);
	}, 1000);
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
// ----------------------------------------------------------------------
// 接続処理.
// ----------------------------------------------------------------------
io.sockets.on("connection", function(socket) {
	socket.on("createPlayerId", createPlayerId);
	socket.on("addGame", function(params, callback) {
		addGame(params, callback, io, socket);
	});
	// 渡されたUUIDとsocketIdを紐づける
	socket.on("setSocketId", setSocketId);
	socket.on("startGame", startGame);
});



// ----------------------------------------------------------------------
// 終了判定.
// ----------------------------------------------------------------------
function gameSet(sankashaList) {
	var liveList = [];
	var jinrou = "人狼";
	var jinrouCount = 0;
	var muraCount = 0;
	for (var i = 0; i < sankashaList.length; i++) {
		var entity = sankashaList[i];
		if (entity.isLive === true && entity.yakushoku === jinrou) {
			jinrouCount++;
		} else {
			muraCount++;
		}
	}
	if (jinrouCount >= muraCount){
		ookamiVictory = true;
	} else if (jinrouCount === 0) {
		murabitoVictory = true;
	}
	
}
