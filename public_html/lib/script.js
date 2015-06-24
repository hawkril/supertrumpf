// config vars
var apiurl = "http://46.4.83.144:8888/api/";
//var apiurl = "test-api/";

var currentstate = 'login';
var username = null;
var sessionid = null;
var lobbyid = null;

var cache = new Object();
var logincontent = null;


$(document).ready(function() {
    
    // cache login page
    logincontent = $("#content").clone();        
    
    // caching xslt style sheets
    $.get("xslt/lobbies.xsl", function(data, status, xhr) { cache.lobbies = xhr.responseText; });
    $.get("xslt/lobby.xsl", function(data, status, xhr) { cache.lobby = xhr.responseText; });
    
    // restore session from cookie
    sessionid = getCookie("session");
    username = getCookie("user");
    lobbyid = getCookie("lobby");
    currentstate = getCookie("state");
    
    // return to state in cookie
    switch (currentstate) {
        case "lobbies":
            if (sessionid) {
                showlobbies();
                return;
            }
            break;
        case "lobby":
            if (sessionid && lobbyid) {
                showlobby();
                return;
            }
            break;
    }
    
    currentstate = "login";
    $("#content").fadeIn();
    
});

// only for permanent ui update
$(document).on("mousemove", "#numplayers", function() {
    var num = $("#numplayers").val();
    $("#lblnumplayers").html(num);
});

$(document).on("click", "#login", function() { login(); });

$(document).keydown(function(event) {
    if (event.key === "Enter") {
        switch (currentstate) {
            case "login":
                login();
                break;
            case "lobbies":
                newgame();
                break;
        }
    }
});

$(document).on("click", "#newgame", function() { newgame(); });

$(document).on("click", "#leavegame", function() { leavegame(); });

$(document).on("click", ".lobby", function(e) { join(e); });

$(document).on("click", "#changename", function() { changename(); });

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
        username = $(data).find("name").text();
        sessionid = $(data).find("id").text();
        document.cookie = "user="+username;
        document.cookie = "session="+sessionid;
        
        if (username !== "" && sessionid !== "") {
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
    
    $.get(apiurl + sessionid + "/lobbies/new/" + encodeURIComponent(name), function(data, status, xhr) {
        lobbyid = $(data).find("lobby > id").text();
        currentstate = "lobby";
        updateCookie();
        
        $("#content").xslt(xhr.responseText, cache.lobby, { "session" : sessionid });
    });
}

function leavegame() {
    
    $.get(apiurl + sessionid + "/lobby/" + lobbyid + "/leave", function(data, status, xhr) {
        // fire and forget for the moment...
        // maybe do a toast...
    });

    lobbyid = null;
    currentstate = "lobbies";
    updateCookie();
    
    showlobbies();
}

function join(e) {
    if (!e)
        return;
    
    var id = $(e.currentTarget).attr("id");
    if (!id)
        return;
    load();
    $.get(apiurl + sessionid + "/lobby/" + id + "/join", function(data, status, xhr) {
        lobbyid = id;
        currentstate = "lobby";
        updateCookie();
        
        $("#content").xslt(xhr.responseText, cache.lobby, {"session": sessionid });
        loaded();
    });
}

function showlobby() {
    $.get(apiurl + sessionid + "/lobby/" + lobbyid + "", function(data, status, xhr) {
        currentstate = "lobby";
        updateCookie();
        
        $("#content").xslt(xhr.responseText, cache.lobby);
    });
}

function changename() {
    var newname = $("#gamename").val();
    if (!newname)
        return;
    
    $.get(apiurl + sessionid + "/lobby/" + lobbyid + "/change_name/" + newname, function(data, status, xhr) {
        // just refresh lobby
        showlobby();
    });
}

function changenum() {
    var num = $("#maxplayers").val();
    if (!num)
        return;
    
    $.get(apiurl + sessionid + "/lobby/" + lobbyid + "/change_num/" + num, function(data, status, xhr) {
        // just refresh lobby
        showlobby();
    });
}

function changeset(e) {
    var set = $(e).attr("name");
    if (!set)
        return;
    
    $.get(apiurl + sessionid + "/lobby/" + lobbyid + "/change_set/" + set, function(data, status, xhr) {
        // just refresh lobby
        showlobby();
    });
}

function showlobbies() {
    load();
    // get lobby
    $.get(apiurl + sessionid + "/lobbies", function(data, status, xhr) {
        if (status !== "success")
            handlehttperror();
        
        // use xslt to convert soap message to page and display it in content area
        var soap = xhr.responseText;
        $("#content").xslt(soap, cache.lobbies);
        loaded();
        
        currentstate = 'lobbies';
        updateCookie();
    });
}



function showlogin() {
    $("#wait").stop(true, true);
    $("#wait").fadeOut(100);
    $("#content").replaceWith(logincontent);
    $("#content").fadeIn(200);
}


function handlehttperror() {
    
}



function getCookie(name) {
    var regex = new RegExp(name + "=(.[^;]+)");
    var match = document.cookie.match(regex);
    if (match)
        return match[1];
    return null;
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

function updateCookie() {
    document.cookie = "user="+ username;
    document.cookie = "session="+ sessionid;
    document.cookie = "lobby=" + lobbyid;
    document.cookie = "state=" + currentstate;
}

function clearCookie() {
    document.cookie = "user=";
    document.cookie = "session=";
    document.cookie = "lobby=";
    document.cookie = "state=";
}