// config vars
var apiurl = "http://46.4.83.144:8888/api/";
//var apiurl = "test-api/";

var session = new Object();
session.currentstate = 'login';
session.username = null;
session.sessionid = null;
session.lobbyid = null;
session.set = null;

// cache storing xslt and xml data
var cache = new Object();

// cache for event listening / polling
var listener = new Object();
listener.POLL_TIMEOUT = 5 * 60 * 1000;

var toast = new Object();
toast.toasttimer = null;



$(document).ready(function() {
    
    // cache login page
    logincontent = $("#content").clone();        
    
    // caching xslt style sheets
    $.get("xslt/lobbies.xsl", function(data, status, xhr) { cache.lobbies = xhr.responseText; });
    $.get("xslt/lobby.xsl", function(data, status, xhr) { cache.lobby = xhr.responseText; });
    $.get("xslt/card.xsl", function(data, status, xhr) { cache.card = xhr.responseText; });

    // cache available card sets as unparsed xml file
    $.get(apiurl + "/sets", function(data, status, xhr) { cache.sets = xhr.responseText; });

    // restore session from cookie
    
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
    $("#lblnumplayers").html(num);
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


$(document).on("change", "#numplayers", function() { changenum(); });

$(document).on("click", "#login", function() { login(); });

$(document).on("click", "#newgame", function() { newgame(); });

$(document).on("click", "#leavegame", function() { leavegame(); });

$(document).on("click", "#startgame", function() { rungame(); });

$(document).on("click", "#changename", function() { changename(); });

$(document).on("click", ".lobby", function(e) { join(e); });

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
        updateCookie();
        
        $("#content").xslt(xhr.responseText, cache.lobby, { "session" : session.sessionid });

        subscribe(session.sessionid + "/lobby/" + session.lobbyid + "/events", refreshgame)
    });
}

function refreshgame(event) {
	//TODO check event type

	$.get(apiurl + session.sessionid + "/lobby/" + session.lobbyid, function(data, status, xhr) {
        $("#content").xslt(xhr.responseText, cache.lobby, { "session" : session.sessionid });
    })
}

function leavegame() {
    
    $.get(apiurl + session.sessionid + "/lobby/" + session.lobbyid + "/leave", function(data, status, xhr) {
        // fire and forget for the moment...
        // maybe do a toast...
        showToast("Das Spiel wurde verlassen...")
    });

    session.lobbyid = null;
    session.currentstate = "lobbies";
    updateCookie();
    
    unsubscribe();
    showlobbies();
}


function rungame() {
	$.get(apiurl + session.sessionid + "/lobby/" + session.lobbyid + "/start", function(data, status, xhr) {
		// fire and forget we should receive an event listening the lobby...
		showToast("Das Spiel wird gestartet...")
    });
    load();
}

function join(e) {
    if (!e)
        return;
    
    var id = $(e.currentTarget).attr("id");
    if (!id)
        return;
    load();
    $.get(apiurl + session.sessionid + "/lobby/" + id + "/join", function(data, status, xhr) {
        session.lobbyid = id;
        session.currentstate = "lobby";
        updateCookie();
        
        $("#content").xslt(xhr.responseText, cache.lobby, {"session": session.sessionid });
        loaded();
        subscribe(session.sessionid + "/lobby/" + session.lobbyid + "/events", refreshgame)

    });
}


function showlobby() {
    $.get(apiurl + session.sessionid + "/lobby/" + session.lobbyid + "", function(data, status, xhr) {
        session.currentstate = "lobby";
        updateCookie();
        
        $("#content").xslt(xhr.responseText, cache.lobby, session.sessionid);
    });
}

function changename() {
    var newname = $("#gamename").val();
    if (!newname)
        return;
    
    $.get(apiurl + session.sessionid + "/lobby/" + session.lobbyid + "/change_name/" + newname, function(data, status, xhr) {
        // just refresh lobby
        showlobby();
    });
}

function changenum() {
    var num = $("#maxplayers").val();
    if (!num)
        return;
    
    $.get(apiurl + session.sessionid + "/lobby/" + session.lobbyid + "/change_num/" + num, function(data, status, xhr) {
        // just refresh lobby
        showlobby();
    });
}

function changeset(e) {
    var set = $(e).attr("name");
    if (!set)
        return;
    
    $.get(apiurl + session.sessionid + "/lobby/" + session.lobbyid + "/change_set/" + set, function(data, status, xhr) {
        // just refresh lobby
        showlobby();
    });
}

function showlobbies() {
    load();
    // get lobby
    $.get(apiurl + session.sessionid + "/lobbies", function(data, status, xhr) {
        if (status !== "success")
            handlehttperror();
        
        // use xslt to convert soap message to page and display it in content area
        var soap = xhr.responseText;
        $("#content").xslt(soap, cache.lobbies);
        loaded();
        
        session.currentstate = 'lobbies';
        updateCookie();
    });
}

function showCard() {
	$.get(apiurl + session.sessionid + "/")
}

function showlogin() {
    $("#wait").stop(true, true);
    $("#wait").fadeOut(100);
    $("#content").replaceWith(logincontent);
    $("#content").fadeIn(200);

}


function handlehttperror() {
    
}

listener.subscribe = function(url, callback) {
	pollpollUrl = url;
	pollCallback = callback;
    poll();
    pollTimer = setTimeout(function() {
    	poll();
    }, POLL_TIMEOUT);
}

listener.poll = function() {
	if (!pollUrl)
		return;

	// poll with http-idle
	$.get(apiurl + pollUrl, function(data, status, xhr) {
		// something happend call callback
		if (pollCallback)
			pollCallback(data);

    	// reset timeout
    	clearTimeout(pollTimer);
	    pollTimer = setTimeout(function() {
	    	poll();
	    }, POLL_TIMEOUT);
    });

}

listener.unsubscribe = function() {
	clearTimeout(pollTimer);
}



toast.show = function(message) {
	if (!toast.toastTimer)
    	clearTimeout(toast.toastTimer);
	
	$("#toast").stop(true, true);
	$("#message").text(message);
	$("#toast").fadeIn(200);
	toast.toastTimer = setTimeout(function() {
		$("#toast").fadeOut(2000);
	}, 2000);
}

function load() {
    $("#wait").stop(true, true);
    $("#content").stop(true, true);     // stop all animations on content element
      
    $("#content").fadeOut();    // fade out content
    $("#wait").fadeIn(100);     // show wait cursor
}

function loaded() {
    $("#wait").stop(true, true);
    $("#content").stop(true, true);     // stop all animations on content element
        
    $("#content").fadeIn(100);    // fade out content
    $("#wait").fadeOut();     // show wait cursor
}

session.updateCookie = function() {
    document.cookie = "user="+ this.username;
    document.cookie = "session="+ this.sessionid;
    document.cookie = "lobby=" + this.lobbyid;
    document.cookie = "state=" + this.currentstate;
}

session.clearCookie = function() {
    document.cookie = "user=";
    document.cookie = "session=";
    document.cookie = "lobby=";
    document.cookie = "state=";
}

session.restore = function() {
    this.sessionid = this.getCookie("session");
    this.username = this.getCookie("user");
    this.lobbyid = this.getCookie("lobby");
    this.currentstate = this.getCookie("state");
}

session.getCookie = function(name) {
    var regex = new RegExp(name + "=(.[^;]+)");
    var match = document.cookie.match(regex);
    if (match)
        return match[1];
    return null;
}