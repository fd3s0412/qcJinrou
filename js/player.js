/**
 * プレイヤーの処理を扱うサーバー用のクラス.
 * @param	{String} playerId 
 * @param	{String} userName 
 * @param	{String} io 
 * @param	{String} socket 
 */
function Player(playerId, userName, io, socket) {
	// クライアントを呼び出し用
	this.io = io;
	// クライアントから呼び出され用
	this.socket = socket;
	// プレイヤーID
	this.playerId = playerId;
	// プレイヤー名
	this.userName = userName;
	// ソケットID
	this.socketId = "";
	// プレイヤー画像
	this.userImage = "";
	// プレイヤーの生死
	this.isLive = true;
	// プレイヤーの役職
	this.yakushoku = "";
	// ボタン制御リスト
	this.enableButtonList = {};
	// 選択プレイヤーID
	this.selectedPlayerId = "";
	// 役職スキルによる選択結果
	this.skillAnser = {};
	// 勝数
	this.won = 0;
	// 敗数
	this.losed = 0;
	// ゲームスタート準備完了フラグ
	this.isReadyToStart = true;

	// クライアント→サーバー用メソッドを準備
	//setCallEventFromClient();
};

/**
 * ゲーム開始時に各ステータスを初期化.
 */
Player.prototype.setCallEventFromClient = function() {
	this.socket.on('tst', selectedPlayerId);
};

/**
 * ゲーム開始時に各ステータスを初期化.
 */
Player.prototype.setDefault = function() {
	this.setLive(true);
	this.resetEnableButtonList();
	this.setSelectedPlayerId("");
};

Player.prototype.resetEnableButtonList = function() {
	this.enableButtonList = {
		playerList : false,
		gameStart : false,
		timerStart : false
	};
}

/**
 * 朝の行動処理.
 * @param	{Number} day gameInfo.day
 */
Player.prototype.doMorning = function(day) {
	// 各対象者の紐づきと発表
	// タイマー（未実装）	this.io.sockets.emit('startTimer');

	// 【テスト用】プレイヤーの選択可状態に変更
	if (this.isLive) {
		this.setEnableButtonList("playerList", true);
		this.io.sockets.emit('selectShokeisha');
	}
};
/**
 * 夕方の行動処理.
 * @param	{Number} day gameInfo.day
 */
Player.prototype.doEvening = function(day) {
	console.log("doEvening");
	this.setSelectedPlayerId("");
	if (this.isLive) {
		this.setEnableButtonList("playerList", true);
		// クライアントに処刑者の選択を要求
		this.io.sockets.emit('selectShokeisha');
	}
};
/**
 * 夜の行動処理.
 * @param	{Number} day gameInfo.day
 */
Player.prototype.doNight = function(day) {
	console.log("doNight");
	this.setSelectedPlayerId("");
	// 処刑者の集計と発表
	if (this.isLive) {
		this.setEnableButtonList("playerList", true);
		// クライアントに対象者の選択を要求
		this.io.sockets.emit('selectTaishosha');
	}
};
/**
 * ゲーム終了処理.
 * @param	{Object} gameInfo ゲーム情報
 */
Player.prototype.doGameSet = function(gameInfo) {
	// 人狼陣営プレイヤーのゲーム終了処理
	if (this.yakushoku === "人狼" || this.yakushoku === "狂人") {
		this.setResult(gameInfo.winner === "人狼");
	}
	// 村人陣営プレイヤーのゲーム終了処理
	else {
		this.setResult(gameInfo.winner === "村人");
	}

	// クライアントにゲームスタートボタンの選択を要求
	this.io.sockets.emit('pushGameReStart');
}

/**
 * ステータス更新 プレイヤー名.
 * @param	{String} userName プレイヤー名
 */
Player.prototype.setName = function(userName) {
	this.userName = userName;
};

/**
 * ステータス更新 ソケットID.
 * @param	{String} socketId ソケットID
 */
Player.prototype.setSocketId = function(socketId) {
	this.socketId = socketId;
};

/**
 * ステータス更新 プレイヤー画像.
 * @param	{String} userImage プレイヤー画像
 */
Player.prototype.setImage = function(userImage) {
	this.userImage = userImage;
};

/**
 * ステータス更新 プレイヤーの生死.
 * @param	{String} userName プレイヤーの生死（true:生存, false:死亡）
 */
Player.prototype.setLive = function(isLive) {
	this.isLive = isLive;
};

/**
 * ステータス更新 役職.
 * @param	{String} yakushoku 役職
 */
Player.prototype.setYakushoku = function(yakushoku) {
	this.yakushoku = yakushoku;
};

/**
 * ステータス更新 ボタン制御リスト.
 * @param	{String} button 制御対象ボタン名
 * @param	{Boolean} flug true = 活性化（Enable）, false = 非活性化（Disenable）
 */
Player.prototype.setEnableButtonList = function(button, flug) {
	this.enableButtonList[button] = flug;
}

/**
 * ステータス更新 選択したプレイヤーID.
 * @param	{String} selectedPlayerId 選択プレイヤーID
 */
Player.prototype.setSelectedPlayerId = function(selectedPlayerId) {
	this.selectedPlayerId = selectedPlayerId;
};

/**
 * ステータス更新 スキル使用結果.
 * @param	{String} selectedPlayerId 選択したプレイヤーID
 * @param	{String} selectedPlayerName 選択したプレイヤー名
 * @param	{Boolean} isJinro 人狼か否か
 */
Player.prototype.setSkillAnser = function(selectedPlayerId, selectedPlayerName, isJinro) {
	if (selectedPlayerId) {
		this.skillAnser = {
			targetPlayerId : selectedPlayerId,
			targetPlayerName : selectedPlayerName,
			isJinro : isJinro
		};
	}
	else {
		this.skillAnser = {};
	}
}

/**
 * ステータス更新 勝敗数.
 * @param	{Boolean} isWon	勝敗（true:勝利, false:敗北）
 */
Player.prototype.setResult = function(isWon) {
	if(isWon) {
		this.won++;
	} else {
		this.losed++;
	}
	console.log(this.won + ", " + this.losed);
};

/**
 * ステータス更新 ゲームスタート準備完了フラグ.
 * @param	{Boolean} isReadyToStart 準備完了可否（true:準備完了, false:未完了）
 */
Player.prototype.setReadyToStart = function(isReadyToStart) {
	this.isReadyToStart = isReadyToStart;
};

/**
 * サーバからのゲーム情報とプレイヤー情報を行動判定用に端末側へ送信.
 * @param	{Object} gemeInfo ゲーム情報
 */
Player.prototype.sendPlayerInfo = function(gameInfo) {
	io.to(this.socketId).emit(
		'checkClient',
		gameInfo,
		{
			isLive: this.isLive,
			yakushoku: this.yakushoku,
			canSelectPlayer: this.canSelectPlayer,
			selectedPlayerId: this.selectedPlayerId
		}
	);
}
/**
 * io.socket.emitできる形式に変換.
 * 全員に向けて送信する各プレイヤー情報であるため、
 * 役職などの他者に知られてはいけない情報はここに書かない点に注意。
 * @param	{List} list 参加者リスト
 */
Player.convertToSend = function(list) {
	var result = [];
	for (var i = 0; i < list.length; i++) {
		var entity = list[i];
		result.push({
			// プレイヤーID
			playerId : entity.playerId,
			// プレイヤー名
			userName : entity.userName,
			// ソケットID
//			socketId : entity.socketId,
			// プレイヤー画像
			userImage : entity.userImage,
			// プレイヤーの生死
			isLive : entity.isLive,
			// プレイヤーの役職
//			yakushoku : entity.yakushoku,
			// プレイヤーの選択可否
			canSelectPlayer : entity.canSelectPlayer,
			// 選択プレイヤーID
			selectedPlayerId : entity.selectedPlayerId,
			// 勝数
			won : entity.won,
			// 敗数
			losed : entity.losed,
			// ゲームスタート準備完了フラグ
			isReadyToStart : entity.isReadyToStart
		});
	}
	return result;
};
/**
 * io.socket.emitできる形式に変換.
 * 端末所持者のみに向けて送信する自身のプレイヤー情報。
 * @param	{Player} mine 端末所持者
 */
Player.convertToSendMine = function(mine) {
	var result = {
		// プレイヤーID
		playerId : mine.playerId,
		// ボタン制御リスト
		enableButtonList : mine.enableButtonList,
		// 選択したプレイヤーID
		selectedPlayerId : mine.selectedPlayerId,
		// プレイヤーの役職
		yakushoku : mine.yakushoku,
		// スキル結果
		skillAnser : mine.skillAnser,
		// プレイヤーの生死
		isLive : mine.isLive,
		// プレイヤーの勝利数
		won : mine.won,
		// プレイヤーの敗北数
		losed : mine.losed
	};
	return result;
};


module.exports = Player;