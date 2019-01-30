// ----------------------------------------------------------------------
// プレイヤーの処理を扱うサーバー用のクラス.
// ----------------------------------------------------------------------
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
	// プレイヤーの選択可否
	this.canSelectPlayer = false;
	// 選択プレイヤーID
	this.selectedPlayerId = "";
	// 勝数
	this.won = 0;
	// 敗数
	this.losed = 0;
	// 勝敗
	this.thisGameWin = null;
	// ゲームスタート準備完了フラグ
	this.isReadyToStart = true;

	// クライアント→サーバー用メソッドを準備
	//setCallEventFromClient();
};

/**
 * ゲーム開始時に各ステータスを初期化.
 * @param yakushoku	役職
 */
Player.prototype.setCallEventFromClient = function() {
	this.socket.on('tst', selectedPlayerId);
};

/**
 * ゲーム開始時に各ステータスを初期化.
 * @param yakushoku	役職
 */
Player.prototype.setDefault = function() {
	this.setLive(true);
	this.setSelectPlayer(false);
	this.setSelectedPlayerId("");
};

/**
 * 朝の行動処理.
 * @param yakushoku	役職
 */
Player.prototype.doMorning = function(day) {
	// 各対象者の紐づきと発表
	// タイマー（未実装）	this.io.sockets.emit('startTimer');

	// 【テスト用】プレイヤーの選択可状態に変更
	if (this.isLive) {
		this.canSelectPlayer = true;
	}
};
/**
 * 夕方の行動処理.
 * @param yakushoku	役職
 */
Player.prototype.doEvening = function(day) {
	console.log("doEvening");
	this.setSelectedPlayerId("");
	if (this.isLive) {
		// プレイヤーの選択可状態に変更
		this.canSelectPlayer = true;
		// クライアントに処刑者の選択を要求
		this.io.sockets.emit('selectShokeisha');
	}
};
/**
 * 夜の行動処理.
 * @param yakushoku	役職
 */
Player.prototype.doNight = function(day) {
	console.log("doNight");
	this.setSelectedPlayerId("");
	// 処刑者の集計と発表
	if (this.isLive) {
		// プレイヤーの選択可状態に変更
		this.canSelectPlayer = true;
		// クライアントに対象者の選択を要求
		this.io.sockets.emit('selectTaishosha');
		// 各役職に応じた対象者を選択
	}
};

/**
 * ステータス更新 プレイヤー名.
 * @param userName	プレイヤー名
 */
Player.prototype.setName = function(userName) {
	this.userName = userName;
};

/**
 * ステータス更新 ソケットID.
 * @param userName	ソケットID
 */
Player.prototype.setSocketId = function(socketId) {
	this.socketId = socketId;
};

/**
 * ステータス更新 プレイヤー画像.
 * @param userImage	プレイヤー画像
 */
Player.prototype.setImage = function(userImage) {
	this.userImage = userImage;
};

/**
 * ステータス更新 プレイヤーの生死.
 * @param userName	プレイヤーの生死（true:生存, false:死亡）
 */
Player.prototype.setLive = function(isLive) {
	this.isLive = isLive;
};

/**
 * ステータス更新 役職.
 * @param yakushoku	役職
 */
Player.prototype.setYakushoku = function(yakushoku) {
	this.yakushoku = yakushoku;
};

/**
 * ステータス更新 役職.
 * @param canSelectPlayer	プレイヤーの選択可否（true:可能, false:不可）
 */
Player.prototype.setSelectPlayer = function(canSelectPlayer) {
	this.canSelectPlayer = canSelectPlayer;
};

/**
 * ステータス更新 役職.
 * @param selectedPlayerId	選択プレイヤーID
 */
Player.prototype.setSelectedPlayerId = function(selectedPlayerId) {
	this.selectedPlayerId = selectedPlayerId;
};

/**
 * ステータス更新 勝敗数.
 * @param isWon	勝敗（true:勝利, false:敗北）
 */
Player.prototype.setResult = function(isWon) {
	if(isWon) {
		this.won++;
	} else {
		this.losed++;
	}
};

/**
 * ステータス更新 役職.
 * @param isReadyToStart	準備完了可否（true:準備完了, false:未完了）
 */
Player.prototype.setReadyToStart = function(isReadyToStart) {
	this.isReadyToStart = isReadyToStart;
};

/**
 * サーバからのゲーム情報とプレイヤー情報を行動判定用に端末側へ送信.
 * @param gemeInfo 
 */
Player.prototype.sendPlayerInfo = function(gameInfo) {
	io.to(this.socketId).emit(
		'checkClient',
		gameInfo,
		{
			isLive: this.isLive,
			yakushoku: this.yakushoku,
			canSelectPlayer: this.canSelectPlayer,
			selectedPlayerId: selectedPlayerId
		}
	);
}
/**
 * io.socket.emitできる形式に変換.
 * 全員に向けて送信する各プレイヤー情報であるため、
 * 役職などの他者に知られてはいけない情報はここに書かない点に注意。
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
 */
Player.convertToSendMine = function(mine) {
	var result = {
		// プレイヤーID
		playerId : mine.playerId,
		// プレイヤーの役職
		yakushoku : mine.yakushoku,
		// 勝敗
		gameResult : mine.thisGameWin
	};
	return result;
};


module.exports = Player;