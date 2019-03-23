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
		// 夕方ボタンDom
		this.$eveningButton = $('#eveningButton');
		// 夜ボタンDom
		this.$nightButton = $('#nightButton');
		// 参加者クリアボタンDom
		this.$clearButton = $('#clearButton');
		// 参加者ボタンDom
		this.$playerButton = $('.Button');
		// メッセージボックスDom
		this.$message = $('div#message');
		// ゲーム情報日数
		this.$gameInfoDay = $('#gameInfoDay');
		// ゲーム情報朝夜区分
		this.$gameInfoGameTime = $('#gameInfoGameTime');
		// ゲーム情報ステータス
		this.$gameInfoStatus = $('#gameInfoStatus');
		// エラーメッセージ表示Dom
		this.$errorMessageBox = $('div#errorMessageBox');
		// メッセージ表示領域（不要？）
		this.$gameInfoMessage = $('#messages');
		// 通信用オブジェクト
		this.socket = io.connect();

		// イベント設定
		this.addEvent();
		// 初期処理
		this.init();
	};
	// ----------------------------------------------------------------------
	// イベント設定.
	// ----------------------------------------------------------------------
	Client.prototype.addEvent = function() {
		var self = this;

		// 確定ボタン
		self.$kakuteiButton.click(function() {
			var userName = self.$userName.val();
			if (self.checkInputName(userName)) {
				localStorage.setItem(CONST_USER_NAME, userName);
				self.send("addGame", {playerId: self.playerId, userName: userName}, function() {
					console.log("added game");
				});
			}
		});
		// ゲームスタートボタン
		self.$startButton.click(function() {
			self.send("startGame");
		});
		// プレイヤーボタン
		self.$userList.on("click", "li", function() {
			console.log(this);
			self.selectPlayer($(this).data("id"));
		});
		// ゲーム情報表示
		self.socket.on("showGameInfo", function(gameInfo) {
			self.showGameInfo(gameInfo);
		});
		// 朝ボタン
		self.$morningButton.click(function() {
			console.log("moveMorning");
			self.send("moveMorning");
			self.changeBtnDisabled(self.$morningButton);
		});
		// 夕方ボタン
		self.$eveningButton.click(function() {
			console.log("moveEvening");
			self.send("moveEvening");
			self.changeBtnDisabled(self.$eveningButton);
		});
		// 夜ボタン
		self.$nightButton.click(function() {
			console.log("moveNight");
			self.send("moveNight");
			self.changeBtnDisabled(self.$nightButton);
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
	Client.prototype.selectPlayer = function(selectedPlayerId) {
		var self = this;
		// サーバと通信
		self.send("selectPlayer", {playerId: self.playerId, selectedPlayerId: selectedPlayerId});
	};
	// ----------------------------------------------------------------------
	// メッセージdivの内容をリセット.
	// ----------------------------------------------------------------------
	Client.prototype.resetMessage = function() {
		var self = this;
		self.$message.html("");
	};
	// ----------------------------------------------------------------------
	// サーバからのゲーム情報を画面に描画.
	// ----------------------------------------------------------------------
	Client.prototype.showGameInfo = function(gameInfo) {
//		console.log(gameInfo);
		this.showGameInfoInner(gameInfo.gameInfo, gameInfo.playerInfo);
		this.showPlayers(gameInfo.sankashaList);

		this.changePlayerView(gameInfo.sankashaList, gameInfo.gameInfo.status);
	};
	// ----------------------------------------------------------------------
	// ゲーム情報部の表示.
	// ----------------------------------------------------------------------
	Client.prototype.showGameInfoInner = function(gameInfo, playerInfo) {
		var self = this;
		var preKey = "pre_" + "gameInfo";
		// 前回の描画情報を保持し、変更があった場合のみ再描画する
		var json = JSON.stringify(gameInfo);
		if (self[preKey] === json) return;
		console.log("showGameInfoInner");
		self[preKey] = json;

		// 日数
		self.$gameInfoDay.html(gameInfo.day);
		// ゲーム時間区分
		self.$gameInfoGameTime.html(gameInfo.gameTime);
		// ゲーム状態
		self.$gameInfoStatus.html(gameInfo.status);
		// メッセージ表示（不要？）
		self.$gameInfoMessage.html(playerInfo.message);

		self.actionBranch(gameInfo, playerInfo);
	};
	// ----------------------------------------------------------------------
	// プレイヤーリストの表示.
	// ----------------------------------------------------------------------
	Client.prototype.showPlayers = function(playerList) {
		var self = this;
		var preKey = "pre_" + "playerList";
		// 前回の描画情報を保持し、変更があった場合のみ再描画する
		var json = JSON.stringify(playerList);
		if (self[preKey] === json) return;
		console.log("showPlayers");
		self[preKey] = json;

		var tag = "";
		for (var i = 0; i < playerList.length; i++) {
			var player = playerList[i];
			tag += '<li data-id="' + player.playerId+ '"><img src="./image/' + player.userImage + '" /><div class="item_name">' + player.userName + '</div></li>';
		}
		this.$userList.empty().html(tag);
	};
	// ----------------------------------------------------------------------
	// プレイヤーリスト表示設定.
	// ----------------------------------------------------------------------
	Client.prototype.changePlayerView = function(playerList, gameStatus) {
		var self = this;
//		console.log(gameStatus);

		for (var i = 0; i < playerList.length; i++) {
			var player = playerList[i];
			var $player = $('li').filter('[data-id="' + player.playerId + '"]');

//			console.log(gameStatus + "," + player.enableButtonList.playerList);
			if (NOW_GAME_MESSAGE !== gameStatus) {
				self.changePlayerViewNomal($player);
			}
			else {
				// 検査プレイヤーが死亡している場合（ゲームフェーズごと確認）
				if (!player.isLive) {
					self.changePlayerViewDead($player);
				}
				// 検査プレイヤーが選択済みの場合（毎秒確認）
				else if (!player.enableButtonList.playerList) {
					self.changePlayerViewSelected($player);
				}
				// 上記以外の場合、ノーマル状態に設定
				else {
					self.changePlayerViewNomal($player);
				}

				// 検査プレイヤーが自分が選択した者の場合（選択時のみ）
				if (player.selectedPlayerId) {
					//self.changePlayerViewSelectPlayer(player.playerId);
				}
			}
		}
	};

	Client.prototype.changePlayerViewSelected = function($player) {
		$player.removeClass("dead");
		$player.addClass("selected");
	};
	Client.prototype.changePlayerViewDead = function($player) {
		$player.removeClass("selected");
		$player.addClass("dead");
	};
	Client.prototype.changePlayerViewNomal = function($player) {
		$player.removeClass("selected");
		$player.removeClass("dead");
	};
	// ----------------------------------------------------------------------
	// ゲーム状態の判定.
	// ----------------------------------------------------------------------
	Client.prototype.actionBranch = function(gameInfo, playerInfo){
		var self = this;
		console.log("actionBranch");
		console.log(gameInfo);

		self.resetMessage();

		if (!gameInfo.status) return;
		else if (END_GAME_MESSAGE === gameInfo.status) {
			self.showResult(gameInfo, playerInfo);
		}
		else if (GAME_TIME_MONING === gameInfo.gameTime) {
			self.doMorning(gameInfo, playerInfo);
		}
		else if (GAME_TIME_EVENING === gameInfo.gameTime) {
			self.doEvening(gameInfo, playerInfo);
		}
		else if (GAME_TIME_NIGHT === gameInfo.gameTime) {
			self.doNight(gameInfo, playerInfo);
		}
	};
	// ----------------------------------------------------------------------
	// 朝の行動を開始する.
	// ----------------------------------------------------------------------
	Client.prototype.doMorning = function(gameInfo, playerInfo) {
		console.log("doMorning");
		var self = this;
		self.setMessage(MONING_MESSAGE, false);

		// 人狼の被害者発表
		if (gameInfo.day > 1){
			if (gameInfo.victim) {
				self.setMessage(gameInfo.victim + RESULT_NIGHT_EAT, true);
			}
			else {
				self.setMessage(RESULT_NIGHT_SAVE, true);
			}
		}
		// 特定の役職者に対してメッセージを追加
		self.executionSkill(playerInfo);
		// ゲーム進行メッセージの表示
		if (playerInfo.isLive){
			self.setMessage(START_TALK, true);
		} else {
			self.setMessage(YOUR_DIE, true);
		}
		// 画面操作：可能に変更
		self.resetForm(false);
		// 時刻ボタンの活性状態設定
		self.changeBtnEnabled(self.$eveningButton);
	};
	// ----------------------------------------------------------------------
	// 夕方の行動を開始する.
	// ----------------------------------------------------------------------
	Client.prototype.doEvening = function(gameInfo, playerInfo) {
		console.log("doEvening");
		var self = this;
		self.setMessage(EVENING_MESSAGE, false);

		if (playerInfo.isLive) {
			// 処刑者の選択
			self.setMessage(DO_SHOKEI + SELECT_PEOPLE_MESSAGE);
			// 画面操作：可能に変更
			self.resetForm(true);
		}
		else {
			self.setMessage(YOUR_DIE, true);
		}
	};
	// ----------------------------------------------------------------------
	// 夜の行動を開始する.
	// ----------------------------------------------------------------------
	Client.prototype.doNight = function(gameInfo, playerInfo) {
		console.log("doNight");
		var self = this;

		if (gameInfo.day === 0) {
			self.setMessage(GAME_START_MESSAGE, false);
			self.setMessage(SHOW_YAKUSHOKU_START + playerInfo.yakushoku + DIV_END, true);
		} else {
			self.setMessage(NIGHT_MESSAGE, false);
			self.setMessage(gameInfo.victim + RESULT_EVENING, true);
		}

		if (playerInfo.isLive) {
			// 各役職の対象者選択
			var targetPlayer = "";
			if (gameInfo.day === 0) {
				targetPlayer =
				 playerInfo.yakushoku === YAKUSHOKU_URANAISHI ? DO_URANAISHI : DO_MURABITO ;
			}
			else {
				switch (playerInfo.yakushoku) {
					// 人狼の場合
					case YAKUSHOKU_JINRO :
						targetPlayer = DO_JINRO;
					break;
					// 占い師の場合
					case YAKUSHOKU_URANAISHI :
						targetPlayer = DO_URANAISHI;
					break;
					// 狩人の場合
					case YAKUSHOKU_KARIUDO :
						targetPlayer = DO_KARIUDO;
					break;
					// 上記以外の役職の場合
					default :
						targetPlayer = DO_MURABITO;
					break;
				}
			}
			self.setMessage(targetPlayer + SELECT_PEOPLE_MESSAGE, true);

			// 画面操作：可能に変更
			self.resetForm(true);
		}
		else {
			self.setMessage(YOUR_DIE, true);
		}
	};
	// ----------------------------------------------------------------------
	// ゲーム結果の表示をする.
	// ----------------------------------------------------------------------
	Client.prototype.showResult = function(gameInfo, playerInfo) {
		console.log("showResult");
		var self = this;

		// 最後の犠牲者を表示
		if (GAME_TIME_MONING === gameInfo.gameTime) {
			self.setMessage(gameInfo.victim + RESULT_NIGHT_EAT, false);
		} else if (GAME_TIME_NIGHT === gameInfo.gameTime) {
			self.setMessage(gameInfo.victim + RESULT_EVENING, false);
		}

		// 自分の所属陣営の勝敗を表示
		var yourTeam = (playerInfo.yakushoku === YAKUSHOKU_JINRO || playerInfo.yakushoku === YAKUSHOKU_KYOJIN)
			? YAKUSHOKU_JINRO : YAKUSHOKU_MURABITO;

		var result = yourTeam + "陣営";
		result += (yourTeam === gameInfo.winner) ? VICTORY_MESSEGE : LOSER_MESSEGE;
		self.setMessage(result, true);

		// ゲーム勝利総数の表示
		self.setMessage(RESULT_GAME, true);
		self.setMessage(RESULT_GAME_WIN + playerInfo.won + "、" + RESULT_GAME_LOSE + playerInfo.losed, true);

		// ゲームマスタの場合、ゲームスタートボタンを活性化
		if (playerInfo.enableButtonList.gameStart) {
			self.changeBtnDisabled(self.$startButton);
		}
	};

	/**
	 * メッセージを画面に表示.
	 * @param	{String} message 表示するメッセージ
	 * @param	{boolean} next 2行目以降のメッセージがどうか
	 */
	Client.prototype.setMessage = function(message, next) {
		var self = this;
		var tag = "";
		if (next) tag = "<br />";
		tag += "<span>" + message + "</span>";
		self.$message.append(tag);
	};
	/**
	 * フォーム部分の活性状態を変更.
	 * @param	{boolean} canAction 画面操作可否
	 */
	Client.prototype.resetForm = function(canAction) {
		var self = this;
		if (canAction) {
			self.changeBtnEnabled(self.$kakuteiButton);
			self.changeBtnEnabled(self.$playerButton);
		} else {
			self.changeBtnDisabled(self.$kakuteiButton);
			self.changeBtnDisabled(self.$playerButton);
		}
	};
	/**
	 * ボタンの活性設定変更 活性化.
	 * @param	{$Object} $obj 対象のボタン
	 */
	Client.prototype.changeBtnEnabled = function($obj) {
		$obj.attr('disabled');
	};
	/**
	 * ボタンの活性設定変更 非活性化.
	 * @param	{$Object} $obj 対象のボタン
	 */
	Client.prototype.changeBtnDisabled = function($obj) {
		$obj.attr('disabled', 'disabled');
	};
	/**
	 * 役職者にだけスキルの処理結果を表示させる.
	 * @param	{Object} playerInfo プレイヤー情報
	 */
	Client.prototype.executionSkill = function(playerInfo) {
		// playerInfo.skillAnser が空のオブジェクトの場合、処理をスキップする
		if (Object.keys(playerInfo.skillAnser).length === 0) return false;

		var self = this;
		var yakushokuMsg = 
			(playerInfo.yakushoku === YAKUSHOKU_URANAISHI)
			? yakushokuMsg = SKILL_URANAISHI :
			(playerInfo.yakushoku === YAKUSHOKU_REIBAISHI)
			? yakushokuMsg = SKILL_REIBAISHI : "";

		var targetPlayerName = playerInfo.skillAnser.targetPlayerName;

		var skillResultMsg = 
			(playerInfo.skillAnser.isJinro) ? SKILL_TRUE : SKILL_FALSE;
		
		self.setMessage(yakushokuMsg + targetPlayerName + skillResultMsg, true);
	};
	/**
	 * 入力された名前が許容文字か確認する.
	 * @param	{String} inputName 入力された名前
	 * @returns	{Boolean} true : 入力された名前が許容文字のみの場合, false : エラーとなる文字が含まれる場合
	 */
	Client.prototype.checkInputName = function(inputName) {
		var self = this;
		// 許容文字ではない場合
		if (inputName.match(/[ヱヰヮ]/) || inputName.match(/[^ァ-ヴA-Za-z0-9ー～]/)) {
			// エラー内容を表示
			self.viewError(self.$userName, "入力が禁止された文字が含まれた名前は入力できません。")
		}
		else return true;
	}
	/**
	 * エラー表示処理.
	 * @param	{$Object} $obj エラー原因として赤くするHTML要素
	 * @param	{String} errorMsg エラーとして表示する文字列
	 */
	Client.prototype.viewError = function($obj, errorMsg) {
		var self = this;
		var tag = "<span>" + errorMsg + "</span>";
		self.$errorMessageBox.append(tag);
	}

	new Client();
});