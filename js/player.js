$(function() {
	// ----------------------------------------------------------------------
	// vC[Ìðµ¤NX.
	// ----------------------------------------------------------------------
	function Player(playerId, userName) {
		// vC[ID
		this.playerId = playerId;
		// vC[¼
		this.userName = userName;
		// vC[æ
		this.userImage = "";
		// vC[ÌðE
		this.yakushoku = "";
		// vC[ÌIðÂ\tO
		this.selectFlag = false;
		// IðvC[ID
		this.selectedPlayerId = "";
		// 
		this.won = 0;
		// s
		this.losed = 0;
		// Q[X^[gõ®¹tO
		this.isReadyToStart = false;
	};

	/**
	 * Xe[^XXV vC[¼.
	 * @param userName	vC[¼
	 */
	Player.prototype.setName = function(userName) {
		this.userName = userName;
	};

	/**
	 * Xe[^XXV vC[æ.
	 * @param userImage	vC[æ
	 */
	Player.prototype.setImage = function(userImage) {
		this.userImage = userImage;
	};

	/**
	 * Xe[^XXV ðE.
	 * @param yakushoku	ðE
	 */
	Player.prototype.setYakushoku = function(yakushoku) {
		this.yakushoku = yakushoku;
	};

	/**
	 * Xe[^XXV ðE.
	 * @param selectFlag	vC[ÌIðÂ\tO
	 */
	Player.prototype.setSelectFlag = function(selectFlag) {
		this.selectFlag = selectFlag;
	};

	/**
	 * Xe[^XXV ðE.
	 * @param selectedPlayerId	IðvC[ID
	 */
	Player.prototype.setSelectedPlayerId = function(selectedPlayerId) {
		this.selectedPlayerId = selectedPlayerId;
	};

	/**
	 * Xe[^XXV s.
	 * @param isWon	sitrue:, false:skj
	 */
	Player.prototype.setResult = function(isWon) {
		if(isWon) {
			this.won++;
		} else {
			this.losed++;
		}
	};

	/**
	 * Xe[^XXV ðE.
	 * @param isReadyToStart	õ®¹ÂÛitrue:õ®¹, false:¢®¹j
	 */
	Player.prototype.setIsReadyToStart = function(isReadyToStart) {
		this.isReadyToStart = isReadyToStart;
	};
	
});