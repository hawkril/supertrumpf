function Game(session, config, node, cache) {
    this.session = session;
    this.config = config;
    this.cache = cache;
    this.node = node;

    this.name = null;
    this.id = null;
    this.set = null;
    this.definition = null;
    this.card = 0;
    this.active = false;

    this.listener = new Listener(config);

    this.finishedCallback = null;
    this.unauthorizedCallback = null;
    this.failedCallback = null;
    
    var me = this;    
    
    $(this.node).on("click", ".property", function(e) {
       var choise = $(e.currentTarget).position();
       me.move(choise);
    });

    this.finished = function(callback) {
        this.finishedCallback = callback;
        return this;
    };

    this.unauthorized = function(callback) {
        this.unauthorizedCallback = callback;
        return this;
    };

    this.failed = function(callback) {
        this.failedCallback = callback;
        return this;
    };
    
    this.start = function(id, lobby) {
        var me = this;

        this.updateCookie({"id": id, "name": lobby.name, "set": lobby.set});

        this.listener.subscribe(this.session.id + "/game/" + this.id + "/events")
            .done(function(data, status) {
                return me._handleevent(data);
            });

        $.get(this.config.apiurl + "set/" + this.set, function(data, status, xhr) { 
            me.definition = $(data).find("set");

            //me.move(1);
            me.refresh();
        });    

    };

    this._handleevent = function(data) {
        var me = this;

        var type = $(data).find("event > type").text();
        var payload = $(data).find("event > payload").text();

        switch (type) {

            case "num_invalid":
                this.refresh();
                return true;

            case "game_move_complete":

                this.refresh();
                return true;

            case "game_invalid_move":

                return true;

            default:
                //just refresh
                this.refresh();
                return true;

        }

    };

    this.move = function(choise) {
        if (!this.active)
            return;
        
        var me = this;
        $.get(this.config.apiurl + this.session.id + "/game/" + this.id + "/move/" + choise);
    };

    this.refresh = function() {
        var me = this;
        $.get(this.config.apiurl + "card/" + this.set + "/" + this.card, function(data, status, xhr) {
            me._draw(data);
        });
    };

    this._draw = function(data, node) {
        var me = this;
        if (data)
            this.data = data;

        if (node)
            this.node = node;

        var xml = $(this.data).find("card").append(this.definition).toXml();
        console.log(xml);
        var style = this.cache.card;
        $(this.node).xslt(xml, style, {"active" : (this.active ? "active" : ""), "name" : ""});
    };

    this._destroy = function() {

        this.clearCookie();
    };

    this.updateCookie = function(obj) {
          if (obj) {
            if (obj.name)   this.name   = obj.name;
            if (obj.id)     this.id   = obj.id;
            if (obj.set)    this.set    = obj.set;
            if (obj.card)   this.card   = obj.card;
        }
        
        document.cookie = "game.name="  + this.name;
        document.cookie = "game.id="  + this.id;
        document.cookie = "game.set="   + this.set;
        document.cookie = "game.card="  + this.set;
    };

    this.clearCookie = function() {
        document.cookie = "game.name=";
        document.cookie = "game.id=";
        document.cookie = "game.set=";
        document.cookie = "game.card=";
    };
    


}

