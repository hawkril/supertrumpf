function Listener() {
    this.pollUrl = null;
    this.pollTimer = null;
    this.pollCallback = null;
    
    this.subscribe = function(url, callback) {
        this.pollUrl = url;
        this.pollCallback = callback;
        var me = this;
        this.pollTimer = setTimeout(function() { me.poll(); }, config.POLL_TIMEOUT);
        this.poll();
    };

    this.poll = function() {
        var me = this;

        if (!me.pollUrl)
            return;

        // poll with http-idle
        $.get(config.APIURL + me.pollUrl, function(data, status, xhr) {
            // something happend call callback
            if (me.pollCallback)
                me.pollCallback($.parseXML(data));

            // reset timeout
            clearTimeout(me.pollTimer);
            me.pollTimer = setTimeout(function() { me.poll(); }, config.POLL_TIMEOUT);
        });
    };

    this.unsubscribe = function() {
	   clearTimeout(this.pollTimer);
    };
};
