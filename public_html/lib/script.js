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
    
    switch (currentstate) {
        case "lobbies":
            if (sessionid) {
                showlobbies();
                return;
            }
            break;
        case "wait":
            if (sessionid && lobbyid) {
                
                return;
            }
            break;
    }
    
    $("#content").fadeIn();
    
});

$(document).on("click", "#login", function() { login(); });

$(document).on("click", "#newgame", function(e) { newgame(); });

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
        lobbyid = $(data).find("id").val();
        currentstate = "lobby";
        document.cookie = "lobby=" + lobbyid;
        document.cookie = "state=" + currentstate;
        
        $("#content").xslt(xhr.responseText, cache.lobby);
    });
}

function join(e) {
    var lobby = $(e).attr("id");
    if (!lobby)
        return;
    
    $.get(apiurl + sessionid + "/" + lobbyid + "/join", function(data, status, xhr) {
        lobbyid = $(data).find("id").val();
        currentstate = "lobby";
        document.cookie = "lobby=" + lobbyid;
        document.cookie = "state=" + currentstate;
        
        $("#content").xslt(xhr.responseText, cache.lobby);
    });
}

function changename() {
    var newname = $("#gamename").val();
    if (!newname)
        return;
    
    $.get(apiurl + sessionid + "/" + lobbyid + "/change_name/" + newname, function(data, status, xhr) {
        //todo
    });
}

function changenum() {
    var num = $("#maxplayers").val();
    if (!num)
        return;
    
    $.get(apiurl + sessionid + "/" + lobbyid + "/change_num/" + num, function(data, status, xhr) {
        //todo
    });
}

function changeset(e) {
    var set = $(e).attr("name");
    if (!set)
        return;
    
    $.get(apiurl + sessionid + "/" + lobbyid + "/change_set/" + set, function(data, status, xhr) {
        //todo
    });
}


function showlobby() {
    
}


function showlobbies() {
    // get lobby
    // url apiurl + "lobby/" + sessionid
    $.get(apiurl + sessionid + "/lobbies", function(data, status, xhr) {
        if (status !== "success")
            handlehttperror();
        
        // use xslt to convert soap message to page and display it in content area
        var soap = xhr.responseText;
        $("#content").stop(true, true);     // stop all animations on content element
        $("#content").xslt(soap, cache.lobbies);
        $("#content").fadeIn(100);
        
        // show new content
        $("#wait").stop(true, true); // stop all animations on wait element
        $("#wait").fadeOut(100);     // fade out wait cursor
        
        currentstate = 'lobbies';
        document.cookie = "state="+currentstate;
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