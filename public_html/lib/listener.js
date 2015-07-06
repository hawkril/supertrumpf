function Listener(url) {
    this.pollUrl = null;
    this.POLL_TIMEOUT = 5 * 60 * 1000;
    this.pollTimer = null;
    this.pollCallback = null;
    this.api = url;
    
    this.subscribe = function(url, callback) {
        this.pollUrl = url;
        this.pollCallback = callback;
        var me = this;
        this.pollTimer = setTimeout(function() { me.poll(); }, me.POLL_TIMEOUT);
        this.poll();
    };

    this.poll = function() {
        var me = this;

        if (!me.pollUrl)
            return;

        // poll with http-idle
        $.get(me.api + me.pollUrl, function(data, status, xhr) {
            // something happend call callback
            if (me.pollCallback)
                me.pollCallback($.parseXML(data));

            // reset timeout
            clearTimeout(me.pollTimer);
            me.pollTimer = setTimeout(function() { me.poll(); }, me.POLL_TIMEOUT);
        });
    };

    this.unsubscribe = function() {
	   clearTimeout(this.pollTimer);
    };
};
