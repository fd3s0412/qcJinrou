$(function() {
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
		// 通信用オブジェクト
		this.socket = io.connect();
		// イベント設定
		this.setEvent();
		// 初期処理
		this.init();
	}
	// ----------------------------------------------------------------------
	// 初期処理.
	// ----------------------------------------------------------------------
	Client.prototype.init = function() {
		var userName = localStorage.getItem("qcJinrouUserName");
		if (userName) {
			this.$userName.val(userName);
		}
		var userId = localStorage.getItem("qcJinrouUserId");
		if (userId) {
			this.send('setSocketId', userId)
		}
	};
	// ----------------------------------------------------------------------
	// イベント設定.
	// ----------------------------------------------------------------------
	Client.prototype.setEvent = function() {
		var self = this;
		this.$kakuteiButton.click(function() {
			self.clickKakuteiButton();
		});
		this.$clearButton.click(function() {
			self.clickClearButton();
		});
		this.$startButton.click(function() {
			self.clickStartButton();
		});
		this.$morningButton.click(function() {
			self.clickMorningButton();
		});
		this.$nightButton.click(function() {
			self.clickNightButton();
		});
		this.socket.on('showUsers', function(userList) {
			self.showUsers(userList);
		});
		this.socket.on('clearId', function() {
			localStorage.removeItem("qcJinrouUserId");
		});
		this.socket.on('showMessage', function(message) {
			$('#messages').prepend($('<li>' + message + '</li>'));
		});
		this.socket.on('requestMorningAction', function(params) {
			self.requestMorningAction(params);
		});
		this.socket.on('requestNightAction', function(params) {
			self.requestNightAction(params);
		});
		this.socket.on('startTimer', function() {
			self.startTimer();
		});
	};
	// ----------------------------------------------------------------------
	// 確定ボタン押下処理.
	// ----------------------------------------------------------------------
	Client.prototype.clickKakuteiButton = function() {
		var params = {
			userName : this.$userName.val()
		};
		var userId = localStorage.getItem("qcJinrouUserId");
		if (userId)
			params.userId = userId;
		this.send('saveUser', params, function(result) {
			localStorage.setItem("qcJinrouUserId", result.userId);
			localStorage.setItem("qcJinrouUserName", result.userName);
		});
	};
	// ----------------------------------------------------------------------
	// 参加者クリアボタン押下処理.
	// ----------------------------------------------------------------------
	Client.prototype.clickClearButton = function() {
		this.send('clear', this.$userName.val());
		$('#gameMessage').empty();
	};
	// ----------------------------------------------------------------------
	// ゲームスタートボタン押下処理.
	// ----------------------------------------------------------------------
	Client.prototype.clickStartButton = function() {
		this.send('start', this.$userName.val());
	};
	// ----------------------------------------------------------------------
	// 朝ボタン押下処理.
	// ----------------------------------------------------------------------
	Client.prototype.clickMorningButton = function() {
		this.send('morning', this.$userName.val());
	};
	// ----------------------------------------------------------------------
	// 夜ボタン押下処理.
	// ----------------------------------------------------------------------
	Client.prototype.clickNightButton = function() {
		this.send('night', this.$userName.val());
	};
	// ----------------------------------------------------------------------
	// サーバーにイベントキーを送信.
	// ----------------------------------------------------------------------
	Client.prototype.send = function(eventKey, params, callback) {
		this.socket.emit(eventKey, params, callback);
	};
	// ----------------------------------------------------------------------
	// 接続中のユーザーを表示.
	// ----------------------------------------------------------------------
	Client.prototype.showUsers = function(userList) {
		this.$userList.empty().append($(this.createTagUserList(userList)));
	};
	// ----------------------------------------------------------------------
	// ユーザー一覧のタグを作成.
	// ----------------------------------------------------------------------
	Client.prototype.createTagUserList = function(userList) {
		var tag = "";
		$.each(userList, function(i, d) {
			var addClass = "";
			if (d.deadFlg) addClass = " dead";
			tag += '<li class="item_user' + addClass + '">';
			if (d.imageName) {
				tag += '<img src="/image/' + d.imageName + '" />';
			}
			tag += '<div class="item_name">' + d.userName + '</div>';
			tag += '<input type="hidden" name="userId" value="' + d._id + '" />';
			tag += '<input type="hidden" name="userName" value="' + d.userName + '" />';
			tag += '<input type="hidden" name="yakushoku" value="' + d.yakushoku + '" />';
			tag += '</li>';
		});
		return tag;
	};
	// ----------------------------------------------------------------------
	// 朝の行動を開始させる.
	// ----------------------------------------------------------------------
	Client.prototype.requestMorningAction = function(params) {
		var self = this;
		var tag = '<h2>あなたの役職</h2><div class="mainMessage">' + params.message + '</div>';
		tag += '<div class="subMessage">'+ params.addMessage + '</div>';
		var $message = $(tag);
		$message.hide();
		$('#gameMessage').empty().append($message);
		$message.fadeIn();
		var $itemUser = $('.item_user');
		$itemUser.click(function() {
			if (params.yakushoku === "占い師") {
				var userName = $(this).find('[name="userName"]').val();
				var yakushoku = $(this).find('[name="yakushoku"]').val();
				var message = userName + 'さんは、 "' + yakushoku + '" です。';
				alert(message);
			} else {
				alert("ご回答ありがとうございました。");
			}
			self.send('morningAction');
			$itemUser.off();
		});
	};
	// ----------------------------------------------------------------------
	// 夜の行動を開始させる.
	// ----------------------------------------------------------------------
	Client.prototype.requestNightAction = function(params) {
		var self = this;
		var tag = '<h2>あなたの役職</h2><div class="mainMessage">' + params.message + '</div>';
		tag += '<div class="subMessage">'+ params.addMessage + '</div>';
		var $message = $(tag);
		$message.hide();
		$('#gameMessage').empty().append($message);
		$message.fadeIn();
		var $itemUser = $('.item_user');
		$itemUser.click(function() {
			var userId = $(this).find('[name="userId"]').val();
			var userName = $(this).find('[name="userName"]').val();
			alert(userName + "さんを選択しました。");
			self.send('nightAction', {userId: userId, userName: userName});
			$itemUser.off();
		});
	};
	// ----------------------------------------------------------------------
	// タイマー.
	// ----------------------------------------------------------------------
	Client.prototype.startTimer = function() {
		var countdown = function(due) {
			var now = new Date();

			var rest = due.getTime() - now.getTime();
			var sec = Math.floor(rest / 1000 % 60);
			var min = Math.floor(rest / 1000 / 60) % 60;
			var hours = Math.floor(rest / 1000 / 60 / 60) % 24;
			var days = Math.floor(rest / 1000 / 60 / 60 / 24);
			var count = [ days, hours, min, sec ];

			return count;
		}

		var goal = new Date();
		goal.setMinutes(goal.getMinutes() + 3);

		// console.log(countdown(goal));
		var count = 0;
		var timer = setInterval(function() {
			count++;
			if (count > (180 * 4)) {
				timerOff();
			}
			var counter = countdown(goal);
			var time = ('00' + counter[1]).slice(-2) + ':'
			+ ('00' + counter[2]).slice(-2) + ':'
			+ ('00' + counter[3]).slice(-2);
			$('#timer').html(time);
		}, 250);

		function timerOff() {
			clearInterval(timer);
		}
	};
	new Client();
});