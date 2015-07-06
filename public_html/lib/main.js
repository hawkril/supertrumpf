// config vars
var apiurl = "http://46.4.83.144:8888/api/";

// cache storing xslt and xml data
var cache = new Object();

var session = new Session();
var toast = new Toast();
var listener = new Listener(apiurl);
var ui = new UI();

$(document).ready(function() {   
    
    // cache login page
    logincontent = $("#content").clone();        
    
    // caching xslt style sheets
    $.get("xslt/lobbies.xsl", function(data, status, xhr) { cache.lobbies = xhr.responseText; });
    $.get("xslt/lobby.xsl", function(data, status, xhr) { cache.lobby = xhr.responseText; });
    $.get("xslt/card.xsl", function(data, status, xhr) { cache.card = xhr.responseText; });
    //$.get("xslt/sets.xsl", function(data, status, xhr) { cache.sets = xhr.responseText; });

    // cache available card sets as unparsed xml file
    $.get(apiurl + "sets", function(data, status, xhr) { 
        cache.sets = "<sets>";
        $(data).find("set").each(function(index, element) {
            cache.sets += $(element).toXml();
        });
        cache.sets += "</sets>";
    });

    // restore session from cookie
    session.restore();
    
    // return to state in cookie
    switch (session.currentstate) {
        case "lobbies":
            if (session.sessionid) {
                showlobbies();
                return;
            }
            break;
        case "lobby":
            if (session.sessionid && session.lobbyid) {
                showlobby();
                return;
            }
            break;
    }
    
    session.currentstate = "login";
    $("#content").fadeIn();
    
});

// only for permanent ui update
$(document).on("mousemove", "#numplayers", function() {
    var num = $("#numplayers").val();
    $(".lbl_changenum").each(function(index, element) {
        $(element).html(num);
    });
});

// enable enter to login and create game
$(document).keydown(function(event) {
    if (event.key === "Enter") {
        switch (session.currentstate) {
            case "login":
                login();
                break;
            case "lobbies":
                newgame();
                break;
        }
    }
});

$(document).on("click", "#login", function() { login(); });

$(document).on("click", "#newgame", function() { newgame(); });

$(document).on("click", "#leavegame", function() { leavegame(); });

$(document).on("click", "#startgame", function() { rungame(); });

$(document).on("change", "#changeset", function() { changeset(); });

$(document).on("click", ".lobby", function(e) { join(e); });

$(document).on("submit", "#changenum", function(e) { 
    e.preventDefault();
    changenum(); 
});

$(document).on("submit", "#changename", function(e) { 
    e.preventDefault();
    changename(); 
});

$(document).on("click", "#open_changenum", function() { 
    $("overlay").fadeOut(200);
    $("#overlay_changenum").fadeIn(200); 
});

$(document).on("click", "#open_changename", function() { 
    $("overlay").fadeOut(200);
    $("#overlay_changename").fadeIn(200); 
});

function changeset() {
    var set = $("#changeset").val();
    if (!set)
        return;
    
    $.get(apiurl + session.sessionid + "/lobby/" + session.lobbyid + "/change_set/" + set, function() {
       toast.show("Kartenset geändert!"); 
    });
    
    session.set = set;
    session.updateCookie();
    // cache set
    $.get(apiurl + "set/" + set, function(data, status, xhr) { cache.set = xhr.responseText; });
}


function changename() {
    var newname = $("#lobbyname").val();
    if (!newname)
        return;
    
    $.get(apiurl + session.sessionid + "/lobby/" + session.lobbyid + "/change_name/" + newname, function(data, status, xhr) {
        // just refresh lobby
        showlobby();
    });
}

function changenum() {
    var num = $("#numplayers").val();
    if (!num)
        return;
    
    $.get(apiurl + session.sessionid + "/lobby/" + session.lobbyid + "/change_num/" + num, function(data, status, xhr) {
        // just refresh lobby
        showlobby();
    });
}

function login() {
    var name = $("#username").val();
    if (name === "") {
        // handle error
        return;
    }
    
    $("#content").fadeOut();    // fade out content
    $("#wait").fadeIn(100);     // show wait cursor

    // login an get session id
    $.get(apiurl + "login/" + encodeURIComponent(name), function(data, status) {        
        if (status !== "success")
            handlehttperror();
        
        // extract session id and corrected username
        session.username = $(data).find("name").text();
        session.sessionid = $(data).find("id").text();
        document.cookie = "user="+session.username;
        document.cookie = "session="+session.sessionid;
        
        if (session.username !== "" && session.sessionid !== "") {
            showlobbies();
        }
        else {
            $("#content").fadeIn(100);
        }
            
    });
}

function newgame() {
    // get name from input
    var name = $("#gamename").val();
    if (!name)
        return;
    
    $.get(apiurl + session.sessionid + "/lobbies/new/" + encodeURIComponent(name), function(data, status, xhr) {
        session.lobbyid = $(data).find("lobby > id").text();
        session.currentstate = "lobby";
        session.updateCookie();
 
        // change set the first to be initialized
        changeset();      

        // show lobby and subscribe...
        showlobby(true);  


    });
}

function refreshgame(event) {
	//TODO check event type

    $.get(apiurl + session.sessionid + "/lobby/" + session.lobbyid, function(data, status, xhr) {
        $("#content").xslt(xhr.responseText, cache.lobby, { "session" : session.sessionid });
    });
}

function leavegame() {
    
    $.get(apiurl + session.sessionid + "/lobby/" + session.lobbyid + "/leave", function(data, status, xhr) {
        // fire and forget for the moment...
        // maybe do a toast...
        toast.show("Das Spiel wurde verlassen...");
    });

    session.lobbyid = null;
    session.currentstate = "lobbies";
    session.updateCookie();
    
    listener.unsubscribe();
    showlobbies();
}


function rungame() {
    ui.busy();
    $.get(apiurl + session.sessionid + "/lobby/" + session.lobbyid + "/start", function(data, status, xhr) {
            // fire and forget we should receive an event listening the lobby...
        toast.show("Das Spiel wird gestartet...");
    });
}

function join(e) {
    if (!e)
        return;
    
    var id = $(e.currentTarget).attr("id");
    if (!id)
        return;
    ui.busy();
    $.get(apiurl + session.sessionid + "/lobby/" + id + "/join", function(data, status, xhr) {
        session.lobbyid = id;
        session.currentstate = "lobby";
        session.updateCookie();
        
        $("#content").xslt(xhr.responseText, cache.lobby, {"session": session.sessionid });
        listener.subscribe(session.sessionid + "/lobby/" + session.lobbyid + "/events", refreshgame);
        ui.ready();
    });
}


function showlobby(subscribe) {
    $.get(apiurl + session.sessionid + "/lobby/" + session.lobbyid + "", function(data) {
        session.currentstate = "lobby";
        session.updateCookie();
        $(data).find("lobby").append(cache.sets);
        //console.log("Lobby: " + $(data).toXml());
        $("#content").xslt($(data).toXml(), cache.lobby, {"session": session.sessionid });
        ui.ready();

        //if (subscribe === true)
            //listener.subscribe(session.sessionid + "/lobby/" + session.lobbyid + "/events", refreshgame);

    });
}

function showlobbies() {
    ui.busy();
    // get lobby
    $.get(apiurl + session.sessionid + "/lobbies", function(data, status, xhr) {
        if (status !== "success")
            handlehttperror();
        
        // use xslt to convert soap message to page and display it in content area
        var soap = xhr.responseText;
        $("#content").xslt(soap, cache.lobbies);
        
        ui.ready();
        session.currentstate = 'lobbies';
        session.updateCookie();
    });
}

function showCard() {
	$.get(apiurl + session.sessionid + "/");
}

function showlogin() {
    $("#wait").stop(true, true);
    $("#wait").fadeOut(100);
    $("#content").replaceWith(logincontent);
    $("#content").fadeIn(200);

}


function handlehttperror() {
    
}
