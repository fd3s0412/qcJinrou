// --------------------------------------------------
// 役職（基本）.
// --------------------------------------------------
function YakuhsokuBase(entity) {
	self.entity = entity;
}
// --------------------------------------------------
// 役職を返す.
// --------------------------------------------------
YakuhsokuBase.prototype.getYakushoku = function() {
	return self.entity.yakushoku;
};
// --------------------------------------------------
// 陣営を返す.
// --------------------------------------------------
YakuhsokuBase.prototype.getJinei = function() {
	var yakushoku = self.entity.yakuho;
	if (yakushoku == "人狼" || yakushoku == "狂人") {
		jinei = "狼陣営";
	} else if (yakushoku == "村人" || yakushoku == "霊媒師" || yakushoku == "占い師") {
		jinei = "村人陣営";
	}
	return yakushoku;
};
// --------------------------------------------------
// 朝の行動.
// --------------------------------------------------
YakushokuKaryudo.prototype.morningAction = function() {
};
