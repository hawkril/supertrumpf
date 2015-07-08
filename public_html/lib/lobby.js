function Lobby(session, config, node, cache) {
    this.session = session;
    this.config = config;
    this.node = node;

    this.data = null;

    this.name = null;
    this.id = null;
    this.set = null;
    this.num = null;
    this.owner = null;

    this.disablerefresh = false;

    this.cache = cache;

    this.listener = new Listener(config);

    this.leavedCallback = null;
    this.unauthorizedCallback = null;
    this.enteredCallback = null;
    this.gamestartedCallback = null;
    this.fullCallback = null;

    var me = this;
    $(this.node).on("click", "#open_changenum", function() { 
        this.disablerefresh = true;
        $(".overlay").fadeOut(200);
        $("#overlay_changenum").fadeIn(200); 
    });

    $(this.node).on("click", "#open_changename", function() { 
        this.disablerefresh = true;
        $(".overlay").fadeOut(200);
        $("#overlay_changename").fadeIn(200); 
    });

    // only for permanent ui update
    $(this.node).on("mousemove", "#numplayers", function() {
        var num = $("#numplayers").val();
        $(".lbl_changenum").each(function(index, element) {
            $(element).html(num);
        });
    });

    $(this.node).on("change", "#changeset", function() { 
        var set = $("#changeset").val();
        if (!set)
            return;

        me.changeSet(set); 
    });

    $(this.node).on("submit", "#changenum", function(e) { 
        e.preventDefault();
        var num = $("#numplayers").val();
        if (!num)
            return;

        this.disablerefresh = false;
        me.changeMaxPlayers(num); 
        $(".overlay").fadeOut(200);
    });

    $(this.node).on("submit", "#changename", function(e) { 
        e.preventDefault();
        var name = $("#lobbyname").val();
        if (!name)
            return;

        this.disablerefresh = false;
        me.changeName(name); 
        $(".overlay").fadeOut(200);
    });

    $(this.node).on("click", "#leavegame", function() {
        me.leave();        
    });

    $(this.node).on("click", "#startgame", function() {
        me.startGame();        
    });

    this.leaved = function(callback) {
        this.leavedCallback = callback;
        return this;
    };

    this.gamestarted = function(callback) {
        this.gamestartedCallback = callback;
        return this;
    };

    this.unauthorized = function(callback) {
        this.unauthorizedCallback = callback;
        return this;
    };

    this.entered = function(callback) {
        this.enteredCallback = callback;
        return this;
    }

    this.full = function(callback) {
        this.fullCallback = callback;
        return this;
    }
    
    this.create = function(name) {
        var me = this;

        this.name = name;

        $.get(this.config.apiurl + this.session.id + "/lobbies/new/" + encodeURIComponent(name), function(data) {
            me._enter(data);

            var set = $("#changeset").val();
            if (set)
                me.changeSet(set); 

        });
    };

    this.join = function(id) {
        var me = this;

        $.get(this.config.apiurl + this.session.id + "/lobby/" + id + "/join", function(data) {

            var type = $(data).find("event > type").text();

            me.set = $(data).find("lobby > set").text();

            me.disablerefresh = true;

            if (!me._handleevent(data))
                return;

            me.disablerefresh = false;

            me._enter(data);

        });
    };

    this._enter = function(data) {
        var me = this;
        var id = $(data).find("lobby > id").text();
        var name = $(data).find("lobby > name").text();
        this.owner = $(data).find("lobby > owner > id").text();
        
        this.updateCookie({"id" : id, "name": name}); 
        this.session.updateCookie({"state": "lobby"});

        this.listener.subscribe(me.session.id + "/lobby/" + this.id + "/events")
            .done(function(data, status) {
                return me._handleevent(data);
            });

        this._draw(data);
    };

    this._handleevent = function(data) {

        var type = $(data).find("event > type").text();
        var payload = $(data).find("event > payload").text();

        switch (type) {

            case "lobby_full":
                if (me.fullCallback);
                    me.fullCallback();
                this._destroy();
                return false;

            case "login_required":
                if (this.unauthorizedCallback)
                    this.unauthorizedCallback();
                this._destroy();
                return false;

            case "lobby_not_joined":
            case "lobby_not_found":
                if (this.leavedCallback)
                    this.leavedCallback();
                this._destroy();
                return false;

            case "lobby_started":
                if (this.gamestartedCallback)
                    this.gamestartedCallback(payload, this);
                this._destroy();
                return false;

            case "lobby_num_players_changed":
                this.num = payload;
                this.refresh();
                return true;

            case "lobby_set_changed":
                this.set = payload;
                this.refresh();
                return true;

            case "lobby_name_changed":
                this.name = payload;
                this.refresh();
                return true;

            case "player_left":
                if (payload === this.owner) {
                    this._destroy();
                    return false;
                }
                this.refresh();
                return true;

            case "player_joined":
            default:
                //just refresh
                this.refresh();
                return true;

        }
    };

    this.leave = function() {
        var me = this;

        $.get(this.config.apiurl + session.id + "/lobby/" + this.id + "/leave", function(data) {

            if (me.leavedCallback)
                me.leavedCallback();

            me._destroy();
        });

    };

    this._destroy = function() {

        this.listener.unsubscribe();

        me.leavedCallback = null;
        me.unauthorizedCallback = null;
        me.gamestartedCallback = null;

        $(this.node).off("click", "#open_changenum");
        $(this.node).off("click", "#open_changename");
        $(this.node).off("mousemove", "#numplayers");
        $(this.node).off("change", "#changeset");
        $(this.node).off("submit", "#changenum");
        $(this.node).off("submit", "#changename");
        $(this.node).off("click", "#leavegame");
        $(this.node).off("click", "#startgame");

        this.clearCookie();
    };

    this.startGame = function() {
        $.get(this.config.apiurl + session.id + "/lobby/" + this.id + "/start", function(data) {
            // fire and forget...
        });
    };

    this.changeMaxPlayers = function(number) {
        $.get(this.config.apiurl + session.id + "/lobby/" + this.id + "/change_num/" + number);
        // fire and forget...

    };

    this.changeName = function(name) {
        $.get(this.config.apiurl + session.id + "/lobby/" + this.id + "/change_name/" + encodeURIComponent(name));
        // fire and forget...
    };

    this.changeSet = function(newset) {
        $.get(this.config.apiurl + session.id + "/lobby/" + this.id + "/change_set/" + encodeURIComponent(newset));
    };

    this.refresh = function() {
        var me = this;

        if (this.disablerefresh)
            return;

        $.get(this.config.apiurl + session.id + "/lobby/" + this.id, function(data, status, xhr) {
            me._draw(data);
        });
    };

    this._draw = function(data, node) {
        if (node)
            this.node = node;

        if (data)
            this.data = data;

        $(this.data).find("lobby").append(this.cache.sets);
        var xml = $(this.data).toXml();
        var style = this.cache.lobby;
        
        $(this.node).xslt(xml, style, {"session": this.session.id });
        
    };

    this.updateCookie = function(obj) {
        if (obj) {
            if (obj.name)   this.name   = obj.name;
            if (obj.id)     this.id     = obj.id; 
        }
        
        document.cookie = "lobby.name="  + this.name;
        document.cookie = "lobby.id=" + this.id;
    };

    this.clearCookie = function() {
        this.name = null;
        this.id = null;

        document.cookie = "lobby.name=";
        document.cookie = "lobby.id=";
    };
    
}

