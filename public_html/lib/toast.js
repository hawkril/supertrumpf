function Toast(node) {
    this.toastTimer = null;
    this.node = node;
    this.id = Math.random() * 10000;
    
    $(node).append("<div class='toastregion' id='toast-" + this.id + "'><div class='toast'><div id='message-" + this.id + "'></div></div></div>");
    
    this.show = function(message) {
	if (!this.toastTimer)
            clearTimeout(this.toastTimer);
	
	$("#toast-" + this.id).stop(true, true);
	$("#message-" + this.id).text(message);
	$("#toast-" + this.id).fadeIn(200);
	this.toastTimer = setTimeout(function() {
		$("#toast-" + this.id).fadeOut(2000);
	}, 2000);
    };
};

