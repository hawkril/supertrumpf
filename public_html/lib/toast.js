function Toast() {
    this.toastTimer = null;
    
    this.show = function(message) {
	if (!this.toastTimer)
    	clearTimeout(this.toastTimer);
	
	$("#toast").stop(true, true);
	$("#message").text(message);
	$("#toast").fadeIn(200);
	this.toastTimer = setTimeout(function() {
		$("#toast").fadeOut(2000);
	}, 2000);
    };
};

