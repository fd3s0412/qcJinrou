var fs = require('fs');
var http = require('http');
var server = http.createServer();

server.on('request', function(req, res) {
	getResource(req, res);
});

var io = require('socket.io').listen(server);
server.listen(8000);

var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var msUserCollection = null;
var trJinrouCollection = null;
var trShokeiCollection = null;
MongoClient.connect("mongodb://127.0.0.1:27017/", function(err, db) {
	if (err)
		throw err;
	var dbo = db.db("qcJinrou");
	msUserCollection = dbo.collection("msUser");
	trJinrouCollection = dbo.collection("trJinrouCollection");
	trShokeiCollection = dbo.collection("trShokeiCollection");
});

var MAX_MESSAGES_SIZE = 30;
var data = {
	messages : []
};
io.sockets.on('connection', function(socket) {
	// ----------------------------------------------------------------------
	// 接続時初期処理.
	// ----------------------------------------------------------------------
	showUsers();
	socket.on('saveUser', saveUser);
	socket.on('clear', clear);
	socket.on('start', start);
	socket.on('setSocketId', setSocketId);
	socket.on('morningAction', morningAction);
	socket.on('nightAction', nightAction);
	socket.on('morning', morning);
	socket.on('night', night);
	// ----------------------------------------------------------------------
	// ユーザー情報保存.
	// ----------------------------------------------------------------------
	function saveUser(params, callback) {
		console.log("soket.id: " + socket.id);

		if (params.userName) {
			params.socketId = socket.id;

			// 新規登録
			if (!params.userId) {
				// 画像ファイル名取得
				getImageName(function(imageName) {
					params.imageName = imageName;
					console.log(params.imageName);
					msUserCollection.insertOne(params, function(err, res) {
						console.log("insert");
						params.userId = params._id;
						callback(params);
						showUsers();
					});
				});
			}
			// 更新
			else {
				var where = {
					_id : ObjectId(params.userId)
				};
				var set = {
					$set : {
						userName : params.userName
					}
				};
				msUserCollection.updateMany(where, set, function(err, res) {
					if (err)
						throw err;
					console.log("update");
					callback(params);
					showUsers();
				});
			}
			showUsers();
		}
		// ----------------------------------------------------------------------
		// 画像ファイル名取得.
		// ----------------------------------------------------------------------
		function getImageName(callback) {
			msUserCollection.find({}).toArray(function(err, result) {
				var count = result.length;
				if (count >= 12)
					count = 11;
				count++;
				callback("monster" + ('00' + count).slice(-2) + ".png");
			});
		}
	}
	// ----------------------------------------------------------------------
	// 参加者クリア.
	// ----------------------------------------------------------------------
	function clear(password) {
		if (password === "password") {
			msUserCollection.deleteMany({}, function(err, result) {
				console.log("delete");
				showUsers();
				io.sockets.emit('clearId');
			});
			trShokeiCollection.deleteMany({});
			trJinrouCollection.deleteMany({});
		}
	}
	// ----------------------------------------------------------------------
	// ゲームスタート.
	// ----------------------------------------------------------------------
	function start(password) {
		if (password === "password") {
			// 役職割振
			setYakushoku();
			// 全員に投票カウント0を設定
			msUserCollection.find({}).toArray(function(err, result) {
				var shokeiList = [];
				for (var i = 0; i < result.length; i++) {
					shokeiList.push({_id: ObjectId(result[i]._id), count: 0});
				}
				trShokeiCollection.insertMany(shokeiList);
				showUsers();
			});
		}
	}
	// ----------------------------------------------------------------------
	// 役職割振.
	// ----------------------------------------------------------------------
	function setYakushoku() {
		msUserCollection.find({}).toArray(function(err, result) {
			var yakushokuList = ["人狼", "狂人", "占い師", "村人"];
			arrayShuffle(result);
			for (var i = 0; i < result.length; i++) {
				var entity = result[i];
				var yakushoku = yakushokuList[(i >= 4 ? 3 : i)];
				var where = {_id: ObjectId(entity._id)};
				var set = {$set: {yakushoku: yakushoku}};
				msUserCollection.updateMany(where, set);
			}
			showMessage("役職を割り振りました。")
		});
	}
	// ----------------------------------------------------------------------
	// タイマースタート.
	// ----------------------------------------------------------------------
	function startTimer() {
		io.sockets.emit('startTimer');
	}
	// ----------------------------------------------------------------------
	// ユーザー一覧描画.
	// ----------------------------------------------------------------------
	function showUsers() {
		msUserCollection.find({}).toArray(function(err, result) {
			// console.log(result);
			io.sockets.emit('showUsers', result);
		});
	}
	// ----------------------------------------------------------------------
	// ソケットID更新.
	// ----------------------------------------------------------------------
	function setSocketId(userId) {
		var where = {_id: ObjectId(userId)};
		var set = {$set: {socketId: socket.id}};
		msUserCollection.updateMany(where, set);
	}
	// ----------------------------------------------------------------------
	// 朝の行動.
	// ----------------------------------------------------------------------
	function morningAction() {
		var where = {socketId: socket.id};
		var set = {$set: {morningActionFlg: true}};
		msUserCollection.updateMany(where, set, function() {
			msUserCollection.find({}).toArray(function(err, result) {
				var allUserEndFlg = true;
				for (var i = 0; i < result.length; i++) {
					var d = result[i];
					if (d.morningActionFlg !== true) {
						allUserEndFlg = false;
						return false;
					}
				}
				if (allUserEndFlg) {
					// 全員の行動が完了した場合
					showMessage("全員の朝の行動が終わりました。話し合いを始めて、誰を処刑するか決めてください。");
					startTimer();
					msUserCollection.updateMany({}, {$set: {morningActionFlg: false}});
				}
			});
		});
	}
	// ----------------------------------------------------------------------
	// 夜の行動.
	// ----------------------------------------------------------------------
	function nightAction(params) {
		var where = {socketId: socket.id};
		var set = {$set: {nightActionFlg: true}};
		msUserCollection.updateMany(where, set, function() {
			msUserCollection.find(where).toArray(function(err, result) {
				var yakushoku = result[0].yakushoku;
				if (yakushoku === "人狼") {
					trJinrouCollection.insertOne(params);
				} else {
					var where = {_id: ObjectId(params.userId)};
					var set = {$inc: {count: 1}};
					console.log(where);
					trShokeiCollection.updateMany(where, set);
				}

				msUserCollection.find({}).toArray(function(err, result) {
					var allUserEndFlg = true;
					for (var i = 0; i < result.length; i++) {
						var d = result[i];
						if (d.nightActionFlg !== true) {
							// ひとりでも行動していない人がいれば夜時間継続
							allUserEndFlg = false;
							return false;
						}
					}
					if (allUserEndFlg) {
						// 全員の行動が完了した場合
						showMessage('全員の夜の行動が終わりました。');

						// 処刑
						trShokeiCollection.find({}).toArray(function(err, result) {
							var maxUserId = null;
							var maxCount = 0;
							console.log("shokei_col");
							console.log(result);
							for (var i = 0; i < result.length; i++) {
								if (maxCount < result[i].count) {
									maxUserId = result[i]._id;
								}
							}
							if (maxUserId) {
								var where = {_id: ObjectId(maxUserId)};
								var set = {$set: {deadFlg: true}};
								msUserCollection.updateMany(where, set, showUsers);
								msUserCollection.find(where).toArray(function(err, result) {
									showMessage('"' + result[0].userName + '" さんが処刑されました。');
								});
							} else {
								showMessage('処刑された人はいませんでした。');
							}

							// 勝敗判定
							isGameSet();
						});

						// 人狼
						trJinrouCollection.find({}).toArray(function(err, result) {
							var jinrouTargetName = "";
							for (var i = 0; i < result.length; i++) {
								if (i > 0) {
									jinrouTargetName += "、 ";
								}
								jinrouTargetName += '"' + result[i].userName + '" さん';
								var where = {_id: ObjectId(result[i].userId)};
								var set = {$set: {deadFlg: true}};
								msUserCollection.updateMany(where, set, showUsers);
							}
							if (jinrouTargetName) {
								showMessage(jinrouTargetName + "が人狼の餌食になりました。");
							} else {
								showMessage("人狼の被害者はいませんでした。");
							}
						});

						msUserCollection.updateMany({}, {$set: {nightActionFlg: false}});
						trJinrouCollection.remove();
						trShokeiCollection.updateMany({}, {$set: {count: 0}});
					}
				});
			});
		});
	}
	// ----------------------------------------------------------------------
	// ステータス変更：朝.
	// ----------------------------------------------------------------------
	function morning() {
		msUserCollection.find({}).toArray(function(err, result) {
			for (var i = 0; i < result.length; i++) {
				var entity = result[i];
				var yakushoku = entity.yakushoku;
				var params = {};
				params.yakushoku = yakushoku;
				params.message = 'あなたは "' + entity.yakushoku + '" です。';
				if (yakushoku === "人狼") {
					params.addMessage = "うまく人狼だとばれないように立ち回りましょう。<br />夜に食べる予定の人間を選択してください。";
				} else if (yakushoku === "占い師") {
					params.addMessage = "一人だけ役職を知ることが出来ます。<br />役職を知りたい人を選択してください。";
				} else if (yakushoku === "狂人") {
					params.addMessage = "人狼側が勝利するとあなたも勝利となります。<br />人狼を助けるよう立ち回りましょう。<br />人狼だと思う人を選択してください。";
				} else {
					params.addMessage = "人狼だと思う人を選択してください。";
				}
				io.to(entity.socketId).emit('requestMorningAction', params);
			}
			showMessage("朝の行動を選択してください。");
		});
	}
	// ----------------------------------------------------------------------
	// ステータス変更：夜.
	// ----------------------------------------------------------------------
	function night() {
		msUserCollection.find({}).toArray(function(err, result) {
			for (var i = 0; i < result.length; i++) {
				var entity = result[i];
				var yakushoku = entity.yakushoku;
				var params = {};
				params.yakushoku = entity.yakushoku;
				params.message = 'あなたは "' + entity.yakushoku + '" です。';
				if (yakushoku === "人狼") {
					params.addMessage = "誰を食べるか選択してください。";
				} else {
					params.addMessage = "処刑する人間を選択してください。<br />もっとも投票数の多い人間が処刑されます。";
				}
				io.to(entity.socketId).emit('requestNightAction', params);
			}
			showMessage("夜の行動を選択してください。");
		});
	}
	// ----------------------------------------------------------------------
	// 勝敗判定.
	// ----------------------------------------------------------------------
	function isGameSet() {
		msUserCollection.find({}).toArray(function (err, result) {
			
			var doesLiveJinrou = function () {
				var count = 0;
				
				for (var i = 0; i < result.length; i++) {
					var entity = result[i];
					if (!entity.deadFlg && entity.yakushoku === "人狼") {
						 count++;
					}
				}
				
				console.log("生きている人狼: " + count);
				return count > 0;
			};
			
			var doesLiveMurabito = function () {
				var count = 0;
				
				for (var i = 0; i < result.length; i++) {
					var entity = result[i];
					if (!entity.deadFlg && entity.yakushoku !== "人狼") {
						 count++;
					}
				}
				
				console.log("生きている村人: " + count);
				return count > 0;
			};
			
			// -----------------------------------------------------------
			// main
			
			var message = null; ;
			var jinrouLiveFlag = doesLiveJinrou();
			var murabitoLiveFlag = doesLiveMurabito();
			
			if (jinrouLiveFlag && !murabitoLiveFlag) {
				message = "オオカミ陣営の勝利！";
			}
			
			if (murabitoLiveFlag && !jinrouLiveFlag) {
				message = "人間の勝利だ！けだものども";
			}
			
			if (message !== null) {
				io.sockets.emit('gameSet', message);
			}
		});
	}
	// ----------------------------------------------------------------------
	// クライアントにメッセージを表示する.
	// ----------------------------------------------------------------------
	function showMessage(message) {
		io.sockets.emit('showMessage', getDateTimeForLog() + message);
	}
});
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
	return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":"
			+ second;
}
// ----------------------------------------------------------------------
// 現在の日時を取得する（ログ用）.
// ----------------------------------------------------------------------
function getDateTimeForLog() {
	return "[" + getDateTime() + "] ";
}
// ----------------------------------------------------------------------
// ソース読込.
// ----------------------------------------------------------------------
function getResource(req, res) {
	var url = req.url;
	console.log(url);
	if ('/' == url) {
		fs.readFile('./public/client.html', 'UTF-8', function(err, data) {
			res.writeHead(200, {
				'Content-Type' : 'text/html'
			});
			res.write(data);
			res.end();
		});
	}
}
