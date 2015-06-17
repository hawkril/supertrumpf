// config vars
var apiurl = "http://46.4.83.144:8888/api/";

var currentstate = 'login';
var username = null;
var sessionid = null;
var cache = new Object();
var logincontent = null;


$(document).ready(function() {
    
    //TODO restore session from cookie if page is reloaded
    
    $("#content").fadeIn();
    
    // cache login page
    logincontent = $("#content").clone();
   
    // caching xslt style sheets
    $.get("xslt/lobbies.xsl", function(data, status, xhr) { cache.lobbies = xhr.responseText; });
    $.get("xslt/lobby.xsl", function(data, status, xhr) { cache.lobby = xhr.responseText; });
    $.get("xslt/newgame.xsl", function(data, status, xhr) { cache.newgame = xhr.responseText; });
});

$(document).on("click", "#login", function() { login(); });

$(document).on("click", ".attribute", function(e) {  });

$(document).on("click", "#newgame", function(e) { newgame() });

function newgame() {
    $.get(apiurl + sessionid + "lobbies/new/NeueLobby", function(data, status) {
        showlobbies();
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
    $.get(apiurl + "login/" + name, function(data, status) {        
        if (status !== "success")
            handlehttperror();
        
        // extract session id and corrected username
        username = $(data).find("name").text();
        sessionid = $(data).find("id").text();
        document.cookie = "username="+username;
        document.cookie = "sessionid="+sessionid;
        
        if (username !== "" && sessionid !== "") {
            showlobbies();
        }
        else {
            $("#content").fadeIn(100);
        }
            
    });
}

function showlogin() {
    $("#wait").stop(true, true);
    $("#wait").fadeOut(100);
    $("#content").replaceWith(logincontent);
    $("#content").fadeIn(200);
}

function showlobbies() {
    // get lobby
    // url apiurl + "lobby/" + sessionid
    $.get(apiurl + "lobby/" + sessionid, function(data, status, xhr) {
        if (status !== "success")
            handlehttperror();
        
        // use xslt to convert soap message to page and display it in content area
        var soap = xhr.responseText;
        $("#content").xslt(soap, cache.lobbies);
        
        // show new content
        $("#wait").stop(true, true); // stop all animations on wait element
        $("#wait").fadeOut(100);     // fade out wait cursor
        $("#content").fadeIn(100);
        currentstate = 'lobbies';
        document.cookie = "state="+currentstate;
    });
}

function handlehttperror() {
    
}