function UI(content, parent, session) {
    this.content = content;
    this.parent = parent;
    this.session = session;
    this.cache = new Object();
    
    // caching xslt style sheets
    $.get("xslt/lobbies.xsl", function(data, status, xhr) { 
        cache.lobbies = xhr.responseText; 
    });
    $.get("xslt/lobby.xsl", function(data, status, xhr) { 
        cache.lobby = xhr.responseText; 
    });
    $.get("xslt/card.xsl", function(data, status, xhr) { 
        cache.card = xhr.responseText; 
    });
    //$.get("xslt/sets.xsl", function(data, status, xhr) { cache.sets = xhr.responseText; });

    // cache available card sets as unparsed xml file
    $.get(config.APIURL + "sets", function(data, status, xhr) { 
        cache.sets = "<sets>";
        $(data).find("set").each(function(index, element) {
            cache.sets += $(element).toXml();
        });
        cache.sets += "</sets>";
    });
    
    if ($("#wait").length === 0)
        $(this.parent).append("<div id='wait'><div><img alt='loading...' src='img/wait.svg /></div></div>");
        
    
    this.showLogin = function() {
        $(this.content).html("\
            <h1>SUPERTRUMPF</h1>\
            <div id='loginbox'> \
                <form id='login'>\
                    <label for='username'>Bitte gib deinen Spielernamen ein:</label> \
                    <input type='text' class='form-control' id='username' placeholder='Spielername'>\
                    <button type='submit' class='btn btn-success'>LOS</button>\
                </form>\
            </div>");
    };
    
    this.showLobby = function(xml, subscribe) {
        var me = this;
        $.get(config.APIURL + this.session.sessionid + "/lobby/" + this.session.lobbyid + "", function(data) {
        
            $(data).find("lobby").append(cache.sets);
            //console.log("Lobby: " + $(data).toXml());
            var param = {"session": me.session.sessionid };
            $("#content").xslt($(data).toXml(), cache.lobby, param);

            //ui.ready();

            if (subscribe === true) {
                 me.session.updateCookie({"state": "lobby"});
                 me.listener.subscribe(me.session.sessionid + "/lobby/" + me.session.lobbyid + "/events", null);
            }

        });
    };
    
    this.showLobbies = function() {
        var me = this;
        // get lobby
        $.get(config.APIURL + this.session.sessionid + "/lobbies", function(data, status, xhr) {
            if (status !== "success")
                handlehttperror();

            // use xslt to convert soap message to page and display it in content area
            var data = xhr.responseText;
            $("#content").xslt(data, cache.lobbies);

            me.session.updateCookie({"state": "lobbies"});
        });
    };
    
    this.showCard = function() {
        
    };
            
            
    
    this.busy = function() {
        $("#wait").stop(true, true);
        $(this.content).stop(true, true);     // stop all animations on content element

        $(this.content).fadeOut();    // fade out content
        $("#wait").fadeIn(100);     // show wait cursor
    };

    this.ready = function() {
        $("#wait").stop(true, true);
        $(this.content).stop(true, true);     // stop all animations on content element

        $(this.content).fadeIn(100);    // fade out content
        $("#wait").fadeOut();     // show wait cursor
    };
}



