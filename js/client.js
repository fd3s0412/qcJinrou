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
		this.$messageDiv = $('div#messageBox')
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
			self.send("addGame", {playerId: self.playerId, userName: userName}, function() {
				console.log("added game");
			});
			return false;
		});
		// ゲームスタートボタン
		self.$startButton.click(function() {
			self.send("startGame");
			return false;
		});
		// プレイヤーボタン
		self.$playerButton.click(function() {
			if (/* Player.canSelectPlayer === true */) {
				var selectedPlayerId = this.val();
				self.selectedPlayer(selectedPlayerId);
			}
			return false;
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
				self.send("setSocketId", self.playerId);
			});
		} else {
			// UUIDとsokcketIdを紐づける
			self.send("setSocketId", self.playerId);
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
		var tag += ">" + message + "</span>";
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


	new Client();
});