function Game(name, session, node) {
    this.name = name;
    this.session = session;
    this.node = node;
    this.gameid = null;
    this.listener = new Listener();
    this.toast = new Toast(node);
    
    var me = this;
    
    $.get(config.APIURL + this.session.sessionid + "/lobbies/new/" + encodeURIComponent(this.name), function(data, status, xhr) {
        me.gameid = $(data).find("lobby > id").text();
    });
    
    
    this.join = function(id) {
       this.gameid = id;
       
        $.get(config.APIURL + this.session.sessionid + "/lobby/" + this.gameid + "/join", function(data, status, xhr) {
            this.session.updateCookie({"lobby": id, "state": "lobby"});

            $("#content").xslt(xhr.responseText, cache.lobby, {"session": this.session.sessionid });
            listener.subscribe(this.session.sessionid + "/lobby/" + this.session.lobbyid + "/events", null);
        });
    }
    
    this.rungame = function() {
        $.get(config.APIURL + this.session.sessionid + "/lobby/" + this.session.lobbyid + "/start", function(data, status, xhr) {
                // fire and forget we should receive an event listening the lobby...
            this.toast.show("Das Spiel wird gestartet...");
        });
    }
    
    this.showlobby = function() {
        $.get(config.APIURL + this.session.sessionid + "/lobby/" + this.session.lobbyid + "", function(data) {
            
        });
        
    };
    
    this.leave = function() {
        $.get(config.APIURL + this.session.sessionid + "/lobby/" + this.session.lobbyid + "/leave", function(data, status, xhr) {
            // fire and forget for the moment...
            // maybe do a toast...
            this.toast.show("Das Spiel wurde verlassen...");
        });

        this.session.updateCookie({"lobby": null, "state": "lobbies"});

        this.listener.unsubscribe();
        showlobbies();
    };
    
    
}

