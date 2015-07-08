function Listener(config) {
    this.config = config;
    this.pollurl = null;
    this.polltimer = null;
    this.response = null;

    this.subscribe = function(url) {
        var me = this;
        this.response = new Response();

        this.pollurl = url;
        setTimeout(function() { me.poll(); }, this.config.minpolldelay);
        return this.response;
    };

    this.poll = function() {
        var me = this;

        if (!me.pollurl)
            return;

        clearTimeout(this.polltimer);
        this.polltimer = setTimeout(function() { me.poll(); }, me.config.polltimeout + me.config.polldelay)

        var start = (new Date()).getTime();
        // poll with http-idle
        $.get(this.config.apiurl + me.pollurl).always(function(data, status, xhr) {
            if (!me.response)
                return;

            var resume = me.response.executeDone(data, xhr.status);
            if (!resume)
                return;

                

            var end = (new Date()).getTime();
            var duration = end - start;

            if (duration < me.config.minpolldelay)
                setTimeout(function() { me.poll(); }, me.config.minpolldelay);
            else
                me.poll();

        });
    };

    this.unsubscribe = function() {
        this.response = null;
        this.pollurl = null;
	    clearTimeout(this.polltimer);
        this.polltimer = null;
    };
};
