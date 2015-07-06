function Listener(url) {
    this.pollUrl = null;
    this.POLL_TIMEOUT = 10 * 1000;
    this.pollTimer = null;
    this.pollCallback = null;
    this.api = url;
    
    this.subscribe = function(url, callback) {
        this.pollUrl = url;
        this.pollCallback = callback;
        var me = this;
        this.pollTimer = setTimeout(function() { me.poll(); }, this.POLL_TIMEOUT);
        //this._poll();
    };

    this.poll = 

    this.call = function(self, callback) {
        self[callback]();
    };

    this.unsubscribe = function() {
	clearTimeout(this.pollTimer);
    };
};

function Callback(object, callback) {
    return function() {
        return function () { object[callback](); };
    };
}

function poll(listener) {
    if (!listener.pollUrl)
        return;

    // poll with http-idle
    $.get(listener.api + listener.pollUrl, function(data, status, xhr) {
        // something happend call callback
        if (listener.pollCallback)
            listener.pollCallback($.parseXML(data));

        // reset timeout
        clearTimeout(listener.pollTimer);
        listener.pollTimer = setTimeout(function() { poll(); }, listener.POLL_TIMEOUT);
    });
}
