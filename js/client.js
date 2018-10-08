$(function() {
	var CONST_USER_NAME = "jinrouUserName";
	var CONST_USR_ID = "jinrouUserId";
	// ----------------------------------------------------------------------
	// クライアントの処理を扱うクラス.
	// ----------------------------------------------------------------------
	function Client() {
		// ユーザー一覧DOM
		this.$userList = $('#userList');
		// ユーザー名Dom
		this.$userName = $('#userName');
		// 確定ボタンDom
		this.$kakuteiButton = $('#kakuteiButton');
		// スタートボタンDom
		this.$startButton = $('#startButton');
		// 朝ボタンDom
		this.$morningButton = $('#morningButton');
		// 夜ボタンDom
		this.$nightButton = $('#nightButton');
		// 参加者クリアボタンDom
		this.$clearButton = $('#clearButton');
		// 参加者ボタンDom
		this.$playerButton = $('.Button');
		// メッセージボックスDom
		this.$messageDiv = $('div#messageBox');
		// ゲーム情報日数
		this.$gameInfoDay = $('#gameInfoDay');
		// ゲーム情報朝夜区分
		this.$gameInfoGameTime = $('#gameInfoGameTime');
		// ゲーム情報ステータス
		this.$gameInfoStatus = $('#gameInfoStatus');
		// 通信用オブジェクト
		this.socket = io.connect();

		// イベント設定
		this.addEvent();
		// 初期処理
		this.init();
	}
	// ----------------------------------------------------------------------
	// イベント設定.
	// ----------------------------------------------------------------------
	Client.prototype.addEvent = function() {
		var self = this;
		// 確定ボタン
		self.$kakuteiButton.click(function() {
			var userName = self.$userName.val();
			localStorage.setItem(CONST_USER_NAME, userName);
			self.send("addGame", {playerId: self.playerId, userName: userName}, function() {
				console.log("added game");
			});
		});
		// ゲームスタートボタン
		self.$startButton.click(function() {
			self.send("startGame");
		});
		// プレイヤーボタン
		self.$playerButton.click(function() {
			if (/* Player.canSelectPlayer === */true) {
				var selectedPlayerId = this.val();
				self.selectedPlayer(selectedPlayerId);
			}
		});
		// ゲーム情報表示
		self.socket.on("showGameInfo", function(gameInfo) {
			self.showGameInfo(gameInfo);
		});
	};
	// ----------------------------------------------------------------------
	// 初期処理.
	// ----------------------------------------------------------------------
	Client.prototype.init = function() {
		var self = this;
		// UUIDが付与されているかチェック
		var playerId = localStorage.getItem(CONST_USR_ID);
		self.playerId = playerId;
		if (!playerId) {
			self.send("createPlayerId", {}, function(result) {
				localStorage.setItem(CONST_USR_ID, result);
				self.playerId = result;
				// UUIDとsokcketIdを紐づける
				self.send("updateSocketId", self.playerId);
			});
		} else {
			// UUIDとsokcketIdを紐づける
			self.send("updateSocketId", self.playerId);
		}
		// 前回入力した名前を復元
		var userName = localStorage.getItem(CONST_USER_NAME);
		if (userName) {
			self.$userName.val(userName);
		}
	};
	// ----------------------------------------------------------------------
	// サーバーにイベントキーを送信.
	// ----------------------------------------------------------------------
	Client.prototype.send = function(eventKey, params, callback) {
		this.socket.emit(eventKey, params, callback);
	};
	// ----------------------------------------------------------------------
	// 選択したプレイヤーIDを送信.
	// ----------------------------------------------------------------------
	Client.prototype.selectedPlayer = function(selectedPlayerId) {
		self.send(postSelectPlayer, {playerId: this.playerId, selectedPlayerId: selectedPlayerId});
	}
	// ----------------------------------------------------------------------
	// サーバーから受け取ったメッセージを画面に表示.
	// ----------------------------------------------------------------------
	Client.prototype.setMessage = function(message) {
		var tag = "<span";
		var tag = tag + ">" + message + "</span>";
		this.$messageDiv.html(tag);
	};
	// ----------------------------------------------------------------------
	// フォーム部分の活性状態を変更.
	// ----------------------------------------------------------------------
	Client.prototype.resetForm = function(canAction) {
		if (canAction === true) {
			$kakuteiButton.removeClass("notAction");
			$playerButton.removeClass("notAction");
		} else {
			$kakuteiButton.addClass("notAction");
			$playerButton.addClass("notAction");
		}
	};
	// ----------------------------------------------------------------------
	// ゲーム状態の判定.
	// ----------------------------------------------------------------------
	Client.prototype.actionBranch = function(gameInfo, sankashaList){
		//if () {}
		//else if () {}
		//else if () {}
		//else if () {}
	}
	// ----------------------------------------------------------------------
	// 朝の行動を開始する.
	// ----------------------------------------------------------------------
	function doMorning(day) {
	}
	// ----------------------------------------------------------------------
	// 夕方の行動を開始する.
	// ----------------------------------------------------------------------
	function doEvening(day) {
		// 処刑者の選択
		sendGameInfo()
	}
	// ----------------------------------------------------------------------
	// 夜の行動を開始する.
	// ----------------------------------------------------------------------
	function doNight(day) {
		// 処刑者の選択
		sendGameInfo()
	}
	// ----------------------------------------------------------------------
	// ゲーム結果の表示をする.
	// ----------------------------------------------------------------------
	function showResult(day) {
	}
	// ----------------------------------------------------------------------
	// フォーム部分の活性状態を変更.
	// ----------------------------------------------------------------------
	Client.prototype.showGameInfo = function(gameInfo) {
		console.log(gameInfo);
		this.showGameInfoInner(gameInfo.gameInfo);
		this.$userList.empty().text(JSON.stringify(gameInfo));
	};
	// ----------------------------------------------------------------------
	// ゲーム情報部の表示.
	// ----------------------------------------------------------------------
	Client.prototype.showGameInfoInner = function(gameInfo) {
		// 日数
		this.$gameInfoDay.html(gameInfo.day);
		// ゲーム時間区分
		this.$gameInfoGameTime.html(gameInfo.gameTime);
		// ゲーム状態
		this.$gameInfoStatus.html(gameInfo.status);
	};
	Client.prototype.showPlayers = function(playerList) {
		for (var i = 0; i < playerList.length; i++) {
			var player = playerList[i];
			canSelectPlayer: false
			isLive: true
			isReadyToStart: true
			losed: 0
			playerId: "79e7cf67-b732-4109-91c2-8d6935945473"
			selectedPlayerId: ""
			userName: "test123"
			won: 0
		}
	};
	new Client();
});