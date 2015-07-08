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
    this.toast = new Toast($("body"));

    var me = this;

    $(this.node).append("<div class='container'></div>");
    $(this.node).append("<div class='message'></div>");

    //this.message = $(this.node).find(".message");
    //this.container = $(this.node).find(".container");

    $(this.node).on("click", ".property", function(e) {
       var choise = $(e.currentTarget).index();
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

        $.get(this.config.apiurl + "set/" + this.set, function(data, status, xhr) { 
            me.definition = $(data).find("set");
        });

        this.listener.subscribe(this.session.id + "/game/" + this.id + "/events")
        .done(function(data, status) {
            return me._handleevent(data);
        });
    };

    this._handleevent = function(data) {
        var me = this;

        var type = $(data).find("event > type").text();
        var payload = $(data).find("event > payload").text();

        switch (type) {


            case "game_not_found":
                if (this.failedCallback)
                    this.failedCallback();

                this._destroy();
                return false;

            case "login_required":
                if (this.unauthorizedCallback)
                    this.unauthorizedCallback();

                this._destroy();
                return false;

            case "game_invalid_move":
                this.refresh();
                return true;


            case "game_next_player":
                this.active = (payload == this.session.id);
                this.refresh();
                return true;

            case "game_move":
                //this._drawMessage(data);
                //this.toast.show
                return true;

            case "game_round_win":
                var id = $(data).find("payload > id").text();
                var player = $(data).find("payload > name").text();
                if (id == this.session.id)
                    this.toast.show("Du hast diese Runde gewonnen!");
                else
                    this.toast.show(player + " hat diese Runde gewonnen");
                return true;    

            case "game_loose":
                if (payload == this.session.id)
                    this.toast.show("DU HAST DAS SPIEL VERLOREN!");
                else
                    this.toast.show("Ein Spieler ist ausgeschieden");

                if (this.finishedCallback)
                    this.finishedCallback();

                this._destroy();
                return false;

            case "game_win":
                if (payload == this.session.id)
                    this.toast.show("DU HAST DAS SPIEL GEWONNEN!");
                else
                    this.toast.show("Das Spiel ist zu Ende, du hast leider nicht gewonnen!");

                if (this.finishedCallback)
                    this.finishedCallback();

                this._destroy();
                return false;


            case "num_invalid":
            case "game_move_complete":
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
        $.get(this.config.apiurl + this.session.id + "/game/" + this.id + "/card", function(data, status, xhr) {
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
        //console.log(xml);
        var style = this.cache.card;
        $(this.node).xslt(xml, style, {"active" : (this.active ? "active" : "")});
    };

    this._drawMessage = function(data) {
        var me = this;

        var xml = $(data).toXml;

        var style = this.cache.message;

        $(this.message).xslt(xml, style);

        setTimeout(function() { $(me.message).fadeOut(); }, 4000); 
    }

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

