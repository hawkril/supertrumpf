function Toast(node) {
    this.toastTimer = null;
    this.node = node;
    this.id = Math.round(Math.random() * 10000);
    
    $(node).append("<div class='toastregion' id='toast-" + this.id + "'><div class='toast'><div id='message-" + this.id + "'></div></div></div>");
    
	$("#toast-" + this.id).fadeOut(200);

    this.show = function(message) {
	    var me = this;
		if (!this.toastTimer)
	            clearTimeout(this.toastTimer);
		
		$("#toast-" + this.id).stop(true, true);
		$("#message-" + this.id).html(message);
		$("#toast-" + this.id).fadeIn(200);
		this.toastTimer = setTimeout(function() {
			$("#toast-" + me.id).fadeOut(2000);
		}, 2000);
    };
};

