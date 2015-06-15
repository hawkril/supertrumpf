// config vars
var apiurl = "api/";

var currentstate = 'login';
var username = null;
var sessionid = null;
var cache = new Object();


$(document).ready(function() {
    
    //TODO restore session from cookie if page is reloaded
    
    $("#content").fadeIn();
   
    // caching xslt style sheets
    $.get("xslt/lobby.xsl", function(data) { cache.lobby = data; });
    $.get("xslt/newgame.xsl", function(data) { cache.newgame = data; });
});

$(document).on("click", "#login", function() { login(); });

$(document).on("click", ".attribute", function(e) {  });




function login() {
    var name = $("#username").val();
    if (name === "") {
        // handle error
        return;
    }
    
    
    $("#content").fadeOut();    // fade out content
    $("#wait").fadeIn(100);     // show wait cursor

    // login an get session id
    $.get(apiurl + "login/" + name, function(data) {
        // extract session id and corrected username
        username = "...";
        sessionid = "...";
        document.cookie = "username="+username;
        document.cookie = "sessionid="+sessionid;
        
        showlobby();
    });
}

function showlobby() {
    // get lobby
    $.get(apiurl + "lobby/" + sessionid, function(data) {
        $("#wait").stop(true, true); // stop all animations on wait element
        $("#wait").fadeOut(100);     // fade out wait cursor
        currentstate = 'lobby';
        document.cookie = "state="+currentstate;

        // use xslt to convert soap message to page and display it in content area
        $("#content").xslt(data, cache.lobby);
    });
}