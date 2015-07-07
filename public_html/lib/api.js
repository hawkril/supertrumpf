function Api(url, node) {
    this.url = url;
    this.node = node;
    this.session = null;
    //this.toast = new Toast($("body"));
    this.cache = new Object();
    
    var me = this;
    // caching xslt style sheets
    $.get("xslt/lobbies.xsl", function(data, status, xhr) { me.cache.lobbies = xhr.responseText; });
    $.get("xslt/lobby.xsl", function(data, status, xhr) { me.cache.lobby = xhr.responseText; });
    $.get("xslt/card.xsl", function(data, status, xhr) { me.cache.card = xhr.responseText; });

    // cache available card sets as unparsed xml file
    $.get(this.url + "sets", function(data, status, xhr) { 
        me.cache.sets = "<sets>";
        $(data).find("set").each(function(index, element) {
            me.cache.sets += $(element).toXml();
        });
        me.cache.sets += "</sets>";
    });
    
    if ($(this.node).find(".content").length === 0)
        $(this.node).append("<div class='content'></div>");
    
    this.content = $(this.node).find(".content")[0];
    
    if ($(this.node).find(".wait").length === 0)
        $(this.node).append("<div class='wait'><div><img alt='loading...' src='img/wait.svg /></div></div>");
        
    this.wait = $(this.node).find(".wait")[0];
    
    this.showLogin = function() {
        $("#content").append("\
            <h1>SUPERTRUMPF</h1>\
            <div id='loginbox'> \
                <form id='login'>\
                    <label for='username'>Bitte gib deinen Spielernamen ein:</label> \
                    <input type='text' class='form-control' id='username' placeholder='Spielername'>\
                    <button type='submit' class='btn btn-success'>LOS</button>\
                </form>\
            </div>");
        
        $("#content").fadeIn();
    };    
    
    
    this.login = function(name) {
        this.session = new Session();
        
        var me = this;
        // login an get session id
        $.get(this.url + "login/" + encodeURIComponent(name), function(data, status) {     

            // extract session id and corrected username
            me.session.updateCookie($(data).find("name").text(), $(data).find("id").text());
            
            if (me.session.username !== "" && me.session.sessionid !== "") {
                
            } else {
                me.toast.show("Login fehlgeschlagen?");
            }

        });
    };
    
    this.showLobbies = function() {
        var me = this;
        // get lobby
        $.get(this.url + this.session.sessionid + "/lobbies", function(data, status, xhr) {
            // use xslt to convert soap message to page and display it in content area
            var data = xhr.responseText;
            $("#content").xslt(data, me.cache.lobbies);

            me.session.updateCookie({"state": "lobbies"});
        });
    };
    
    
    
};

