$(function() {
	// ----------------------------------------------------------------------
	// プレイヤーの処理を扱うクラス.
	// ----------------------------------------------------------------------
	function Player(playerId, userName) {
		// プレイヤーID
		this.playerId = playerId;
		// プレイヤー名
		this.userName = userName;
		// プレイヤー画像
		this.userImage = "";
		// プレイヤーの役職
		this.yakushoku = "";
		// プレイヤーの選択可能フラグ
		this.selectFlag = false;
		// 選択プレイヤーID
		this.selectedPlayerId = "";
		// 勝数
		this.won = 0;
		// 敗数
		this.losed = 0;
		// ゲームスタート準備完了フラグ
		this.isReadyToStart = false;
	};

	/**
	 * ステータス更新 プレイヤー名.
	 * @param userName	プレイヤー名
	 */
	Player.prototype.setName = function(userName) {
		this.userName = userName;
	};

	/**
	 * ステータス更新 プレイヤー画像.
	 * @param userImage	プレイヤー画像
	 */
	Player.prototype.setImage = function(userImage) {
		this.userImage = userImage;
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
	 * @param selectFlag	プレイヤーの選択可能フラグ
	 */
	Player.prototype.setSelectFlag = function(selectFlag) {
		this.selectFlag = selectFlag;
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
	Player.prototype.setIsReadyToStart = function(isReadyToStart) {
		this.isReadyToStart = isReadyToStart;
	};
	
});