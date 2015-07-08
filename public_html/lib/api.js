function Api(config) {
    this.config = config;

    // nodes
    this.content = null;
    this.wait = null;

    // state objects
    this.session = null;
    this.lobby = null;
    this.game = null;
    
    this.intervall = null;

    //this.toast = new Toast($("body"));
    this.cache = new Object();

    this.init = function() {
        var me = this;
        // caching xslt style sheets
        $.get("xslt/lobbies.xsl", function(data, status, xhr) { me.cache.lobbies = xhr.responseText; });
        $.get("xslt/lobby.xsl", function(data, status, xhr) { me.cache.lobby = xhr.responseText; });
        $.get("xslt/card.xsl", function(data, status, xhr) { me.cache.card = xhr.responseText; });
        $.get("xslt/message.xsl", function(data, status, xhr) { me.cache.message = xhr.responseText; });

        this.cache.login = "\
            <h1>SUPERTRUMPF</h1>\
            <div id='loginbox'> \
                <form id='login'>\
                    <label for='username'>Bitte gib deinen Spielernamen ein:</label> \
                    <input type='text' class='form-control' id='username' placeholder='Spielername'>\
                    <button type='submit' class='btn btn-success'>LOS</button>\
                </form>\
            </div>";
        
        this.cache.staticlobbies = " \
            <div class='mainbox lobbies'>\
                <div id='header'>Wähle ein Spiel aus...</div>\
                <div id='main'></div>\
                <div id='footer'>\
                    <form id='newgame'>\
                        <label for='gamename'>Neues Spiel:</label> \
                        <input type='text' class='form-control' id='gamename' placeholder='Name deines Spiels' />\
                        <button type='submit' class='btn btn-success'>Spiel erstellen</button>\
                    </form>\
                </div>\
            </div>";

        // cache available card sets as unparsed xml file
        $.get(this.config.apiurl + "sets", function(data) { 
            me.cache.sets = "<sets>";
            $(data).find("set").each(function(index, element) {
                me.cache.sets += $(element).toXml();
            });
            me.cache.sets += "</sets>";
        });
        
        if ($(this.config.node).find(".content").length === 0)
            $(this.config.node).append("<div class='content'></div>");
        
        this.content = $(this.config.node).find(".content")[0];
        
        if ($(this.config.node).find(".wait").length === 0)
            $(this.config.node).append("<div class='wait'><div><img alt='loading...' src='img/wait.svg /></div></div>");
            
        this.wait = $(this.config.node).find(".wait")[0];

    };
    
    
    this.showLogin = function() {
        $(this.content).html(this.cache.login);
        $(this.content).fadeIn();
    };    
    
    
    this.login = function(name) {
        var me = this;

        this.session = new Session();
        
        // login an get session id
        $.get(this.config.apiurl + "login/" + encodeURIComponent(name), function(data, status) {     
            var user = $(data).find("name").text();
            var id = $(data).find("id").text();
            // extract session id and corrected username
            me.session.updateCookie({"user": user, "id": id});
            
            if (me.session.signedIn()) {
                me.showLobbies();
            } else {
                me.toast.show("Login fehlgeschlagen?");
            }

        });
    };
    
    this.showLobbies = function() {
        var me = this;
        $(this.content).html(this.cache.staticlobbies);
        this.refresh();
        
        this.intervall = setInterval(function() { me.refresh(); }, 5000);

    };
    
    this.refresh = function() {
        var me = this;
        $.get(this.config.apiurl + this.session.id + "/lobbies", function(data, status, xhr) {
            // use xslt to convert soap message to page and display it in content area
            var xml = $(data).find("event").append(me.cache.sets).toXml();
            var style = me.cache.lobbies;
            $("#main").xslt(xml, style);

            me.session.updateCookie({"state": "lobbies"});
        });
    };

    this.createLobby = function(name) {
        this._prepareLobby();
        this.lobby.create(name);
    };

    this.joinLobby = function(id) {
        this._prepareLobby();
        this.lobby.join(id);
    };

    this._prepareLobby = function() {
        var me = this;
        clearInterval(this.intervall);

        // first leave old lobby
        if (this.lobby)
            this.lobby.leave();

        this.lobby = new Lobby(this.session, this.config, this.content, this.cache);
        this.lobby
            .unauthorized(function() { me._handleUnauthorized(); })
            .gamestarted(function(id, lobby) { me._handleGamestarted(id, lobby); })
            .leaved(function() { me._handleLeaved(); })
            .full(function() { me._handleFull(); });
    };


    this._handleFull = function() {
        if (this.lobby)
            this.lobby = null;

        this.showLobbies();
    };

    this._handleUnauthorized = function() {
        if (this.lobby) 
            this.lobby = null;            

        this.showLogin();
    };

    this._handleLeaved = function() {
        if (this.lobby)
            this.lobby = null;

        this.showLobbies();
    };

    this._handleGamestarted = function(id, lobby) {
        var me = this;
        if (this.lobby)
            this.lobby = null;

        this.game = new Game(this.session, this.config, this.content, this.cache);
        this.game.start(id, lobby);
        this.game
            .failed(function() { me.showLobbies(); })
            .finished(function() { me.showLobbies(); })
            .unauthorized(function() { me.showLogin(); });
    };

    this.leaveLobby = function() {
        var me = this;

        if (!this.lobby)
            return;

        this.lobby.leave();

        this.lobby = null;
        this.game = null;
        this.showLobbies();
    };

    this.startGame = function() {
        var me = this;

        if (!this.lobby)
            return;

        this.lobby.startGame();
    };
    
    
    
};

