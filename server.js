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
// ゲームインフォオブジェクト（{String} status: ゲーム中か否か, {Integer} day: ターン数, {String} gameTime: 朝か夕方か夜か, {String} victim: 前の時間の被害者, winner: 勝利陣営）
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

	// 行動未完了者が存在しない。もしくは、ゲーム中ではない場合は、下記の処理は実行しない
	if (existsKodoMikanryo(sankashaList) || gameInfo.status !== "ゲーム中") return false;

	// 時間経過処理
	console.log("時間が進みます。");
	switch (gameInfo.gameTime) {
		case "朝":
			gameInfo.gameTime = "夕方";
		break;
		case "夕方":
			gameInfo.gameTime = "夜";
		break;
		case "夜":
			gameInfo.day++;
			gameInfo.gameTime = "朝";
		break;
		default: break;
	}

	// 時間ごとのゲーム処理
	switch (gameInfo.gameTime) {
		case "夜":
			console.log("夜になりました。");

			if (gameInfo.day > 0) {
				// 処刑者設定
				executeShokei(sankashaList);
				// ゲーム終了チェック
				isThisGameSet(sankashaList);
			}

			// 端末処理
			for (var i = 0; i < sankashaList.length; i++) {
				var d = sankashaList[i];
				d.doNight(gameInfo.day);
			}
		break;
		case "朝":
			console.log("朝になりました。");

			// 役職者のスキル処理
			executeSkill(sankashaList);
			if (gameInfo.day > 1) {
				// 人狼の被害者設定
				executeEat(sankashaList);
				// ゲーム終了チェック
				isThisGameSet(sankashaList);
			}

			// 端末処理
			for (var i = 0; i < sankashaList.length; i++) {
				var d = sankashaList[i];
				d.doMorning(gameInfo.day);
			}
		break;
		case "夕方":
			console.log("夕方になりました。");
			console.log(sankashaList);

			// 端末処理
			for (var i = 0; i < sankashaList.length; i++) {
				var d = sankashaList[i];
				d.doEvening(gameInfo.day);
			}
		break;
		default: break;
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
	console.log("catch GameStart.")
	// ゲーム情報の初期化
	gameInfo = {
		status : "ゲーム中",
		day : 0,
		gameTime : "夜",		
		victim : null,
		winner : null
	}

	// 参加者
	sankashaList = getSankashaList(playerMap);
	// 役職割振り
	setYakushoku(sankashaList);
	// 準備完了状態のプレイヤーにゲーム開始共通処理を実施
	for (var i = 0; i < sankashaList.length; i++) {
		sankashaList[i].setDefault();
	}
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
			playerInfo: Player.convertToSendMine(sankasha)
		});
	}
}
/**
 * 参加者リストを返す.
 * @param	{Map} playerMap プレイヤーマップ
 * @return	{Array} sankashaList 参加者リスト 
 */
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
/**
 * 人数に応じて人狼を追加.
 * @param	{Array} yakushokuList 
 * @param	{Number} sankashaNinzu 
 * @return	{Array} 人狼が追加された役職リスト
 */
function addJinro(yakushokuList, sankashaNinzu) {
	yakushokuList.push("人狼");
	for (var i = 0; i < sankashaNinzu / 7; i++) {
		yakushokuList.push("人狼");
	}
	return yakushokuList;
}
/**
 * 人数に応じて村人を追加.
 * @param	{Array} yakushokuList 
 * @param	{Number} sankashaNinzu 
 * @return	{Array} 村人が追加された役職リスト
 */
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
/**
 * 現在の日時を取得する.
 * @return	{String} 現在の日時
 */
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
/**
 * 現在の日時を取得する（ログ用）.
 * @return	{String} 現在の日時
 */
function getDateTimeForLog() {
	return "[" + getDateTime() + "] ";
}
/**
 * 行動未完了存在判定.
 * @param	{Array} sankashaList 参加者リスト
 * @return	{Boolean} true:行動未完了者あり, false:全員行動完了
 */
function existsKodoMikanryo(sankashaList) {
	for (var i = 0; i < sankashaList.length; i++) {
		var entity = sankashaList[i];
		if (entity.isLive && entity.enableButtonList.playerList) {
			return true;
		}
	}
	return false;
}
/**
 * 終了判定.
 * @param	{Array} sankashaList 参加者リスト
 * @return	{Boolean} true:ゲーム終了, false:ゲーム続行
 */
function isThisGameSet(sankashaList) {
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
	if (jinrouCount >= muraCount || jinrouCount === 0) {
		gameInfo.winner = (jinrouCount === 0) ? "村人" : "人狼";
		gameInfo.status = "ゲーム終了";

		for (var i = 0; i < sankashaList.length; i++) {
			var d = sankashaList[i];
			d.doGameSet(gameInfo);
		}
		return true;
	}
	return false;
}
// ----------------------------------------------------------------------
// プレイヤー選択.
// ----------------------------------------------------------------------
function selectPlayer(obj) {
	var entity = playerMap[obj.playerId];
	entity.selectedPlayerId = obj.selectedPlayerId;
	entity.setEnableButtonList("playerList", false);
}
// ----------------------------------------------------------------------
// 処刑.
// ----------------------------------------------------------------------
function executeShokei(sankashaList) {
	console.log("executeShokei");
	// 全てのプレイヤーが投票したプレイヤーIDを取得
	var shokeishaId = vote(sankashaList);
	var victimPlayer = seachPlayerByPlayerId(sankashaList, shokeishaId);
	// 処刑されたプレイヤー名をゲーム情報に保存し、死亡させる
	console.log(victimPlayer);
	gameInfo.victim = victimPlayer.userName;
	victimPlayer.isLive = false;
}
// ----------------------------------------------------------------------
// スキルイベント.
// ----------------------------------------------------------------------
function executeSkill(sankashaList) {
	for (var i = 0; i < sankashaList.length; i++){
		var entity = sankashaList[i];
		if (!entity.isLive) {
			entity.setSkillAnser();
			continue;
		}
		// 占い師
		if (entity.yakushoku === "占い師") {
			// 占い師プレイヤーが選択したプレイヤーの役職が人狼か真偽値で返却
			var uranaiPlayer = seachPlayerByPlayerId(sankashaList, entity.selectedPlayerId);
			entity.setSkillAnser(
				uranaiPlayer.playerId,
				uranaiPlayer.userName,
				uranaiPlayer.yakushoku === "人狼"
			);

		}
		// 霊媒師
		else if (entity.yakushoku === "霊媒師") {
			if (gameInfo.day < 1.1) continue;
			// 処刑されたプレイヤーの役職が人狼か真偽値で返却
			var reibaiPlayer = seachPlayerByPlayerId(sankashaList, gameInfo.victim);
			entity.setSkillAnser(
				reibaiPlayer.playerId,
				reibaiPlayer.userName,
				reibaiPlayer.yakushoku === "人狼"
			);
		}
	}
}
// ----------------------------------------------------------------------
// 捕食.
// ----------------------------------------------------------------------
function executeEat(sankashaList) {
	// 人狼プレイヤーが投票したプレイヤーIDを取得
	var jinroList = refinePlayerListByYakushoku(sankashaList, "人狼");
	var hosyokushaId = vote(jinroList);
	var hosyokusha = seachPlayerByPlayerId(sankashaList, hosyokushaId);
	// 狩人プレイヤー情報を取得（現在の設定では狩人はゲーム中1人）
	var kariudoList = refinePlayerListByYakushoku(sankashaList, "狩人");
	if (kariudoList.length > 0) {
		var kariudo = kariudoList[0];
		if (kariudo.isLive && kariudo.selectedPlayerId === hosyokushaId){
			hosyokusha = null;
		}
	}
	// 捕食プレイヤーが存在する場合、プレイヤー名をゲーム情報に保存し、死亡させる
	if (hosyokusha) {
		gameInfo.victim = hosyokusha.userName;
		hosyokusha.isLive = false;
	} else {
		gameInfo.victim = null;
	}
}
/**
 * 投票機能.
 * @param	{Array} tohyoshaList 投票者リスト
 * @return	{Number} tohyoshaList.selectedPlayerで最も多いプレイヤーID
 */
function vote(tohyoshaList) {
	// 集計
	var vote = {};
	for (var i = 0; i < tohyoshaList.length; i++) {
		var entity = tohyoshaList[i];
		if (!entity.isLive) continue;
		var selectPlayer = entity.selectedPlayerId;
		if (vote[selectPlayer]) {
			vote[selectPlayer] += 1;
		} else {
			vote[selectPlayer] = 1;
		}
	}

	// 投票数のみの配列を生成
	var ids = Object.keys(vote);
	var count = [];
	for (var i = 0; i < ids.length; i++) {
		var key = ids[i];
		count[i] = vote[key];
	}

	// 投票数が最も多いプレイヤーのインデックスを取得(複数あり)
	var maxCount = Math.max(...count);
	var indexes = [];
	for (var i = 0; i < count.length; i++) {
		var index = count.indexOf(maxCount, indexes.length);
		indexes.push(index);
	}

	// 投票数が最多のプレイヤーIDを返却（複数の場合、ランダムで決定）
	var targetIndex = indexes[Math.floor(Math.random() * indexes.length)];
	console.log("一番投票数が多い人のインデックス（←idになってる）：" + ids[targetIndex]);
	return ids[targetIndex];
}
/**
 * プレイヤー検索機能.
 * @param	{Array} sankashaList 参加者リスト
 * @param	{String} id 対象のプレイヤーID
 * @return	{Player} 検索対象のプレイヤー情報
 */
function seachPlayerByPlayerId(sankashaList, id) {
	var targetPlayer = {};
	for (var i = 0; i < sankashaList.length; i++) {
		var entity = sankashaList[i];
		if (entity.playerId === id) {
			targetPlayer = entity;
		}
	}
	return targetPlayer;
}
/**
 * プレイヤー絞り込み機能.
 * @param	{Array} sankashaList 参加者リスト
 * @param	{String} yakushoku 対象の役職
 * @return	{Array} 役職で絞り込まれた参加者リスト
 */
function refinePlayerListByYakushoku(sankashaList, yakushoku) {
	var result = [];
	for (var i = 0; i < sankashaList.length; i++) {
		var entity = sankashaList[i];
		if (entity.yakushoku === yakushoku) {
			result.push(entity);
		}
	}
	return result;
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
	// ゲームスタート
	socket.on("startGame", startGame);
	// プレイヤー選択
	socket.on("selectPlayer", selectPlayer);
	// 夕方（処刑者選択）へゲームを進める
//	socket.on("moveEvening", null);
});
/*
  課題リスト
  1.タグを名前で設定するとプレイヤーIDが設定されない
  2.確定ボタンを参加ボタンに表記を変える
  3.人狼が割り振られない場合がある
  4.自分を選択できてしまう
  5.ゲームをリスタートすることができない
  6.夕方、夜の殺人結果、ゲームが終了した場合、殺された人が表示されない
  7.死亡状態のCSSが表示されない（各ゲームフェーズと結果表示）
  8.リネームするとインデックスと名前が変わる
  9.インデックス情報と名前が変わる？
 10.役職割り振りが正常に機能していない（リネームが原因？）
 11.予約語（evalとか）を使うとバグる？
 12.夕方の投票が機能していない
 13.8か11のせいでサーバと端末のプレイヤー情報がずれる？
 （サーバでは人狼なのに、端末では占い師として表示される）
 */