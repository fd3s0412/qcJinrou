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
		// 画面操作：不可に変更
		resetForm(false);
		// サーバと通信
		self.send(postSelectPlayer, {playerId: this.playerId, selectedPlayerId: selectedPlayerId});
	}
	// ----------------------------------------------------------------------
	// メッセージを画面に表示.
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
		if ("ゲーム中" !== gameInfo.status) {
			showResult(gameInfo);
		}
		else if ("朝" === gameInfo.gameTime) {
			doMorning(gameInfo);
		}
		else if ("夕方" === gameInfo.gameTime) {
			doEvening(gameInfo);
		}
		else if ("夜" === gameInfo.gameTime) {
			doNight(gameInfo);
		}
	}
	// ----------------------------------------------------------------------
	// 朝の行動を開始する.
	// ----------------------------------------------------------------------
	function doMorning(gameInfo) {
		// タイマーの表示
	}
	// ----------------------------------------------------------------------
	// 夕方の行動を開始する.
	// ----------------------------------------------------------------------
	function doEvening(gameInfo) {
		// 処刑者の選択
		setMessage(DO_SHOKEI + SELECT_PEOPLE_MESSAGE);
		// 画面の表示設定
		sendGameInfo(gameInfo)
	}
	// ----------------------------------------------------------------------
	// 夜の行動を開始する.
	// ----------------------------------------------------------------------
	function doNight(gameInfo) {
		// 各役職の対象者選択
		setMessage(DO_JINRO + SELECT_PEOPLE_MESSAGE);	// 例：人狼の場合
		// 画面の表示設定
		sendGameInfo(gameInfo)
	}
	// ----------------------------------------------------------------------
	// ゲーム結果の表示をする.
	// ----------------------------------------------------------------------
	function showResult(gameInfo) {
	}
	// ----------------------------------------------------------------------
	// プレイヤー選択状態を表示をする.
	// ----------------------------------------------------------------------
	function sendGameInfo(gameInfo) {
		// 画面操作：可能に変更
		resetForm(true);
	}
	// ----------------------------------------------------------------------
	// サーバからのゲーム情報を画面に描画.
	// ----------------------------------------------------------------------
	Client.prototype.showGameInfo = function(gameInfo) {
		this.$userList.empty().text(JSON.stringify(gameInfo));
		f
		var tag = '<li>
				<img src="./image/monster01.png" />
				<div class="item_name">ＡＢＣＤＥＦ</div>
			</li>';
		this.$userList.empty().html(tag);
	};
	// ----------------------------------------------------------------------
	// サーバからのゲーム情報を画面に描画.
	// ----------------------------------------------------------------------
	function showPlayesList(gameInfo) {
		this.$userList.empty().
	}

	new Client();
});