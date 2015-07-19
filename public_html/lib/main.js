var session = null;
var ui = null;

$(document).ready(function() {   
    
    
    // restore session from cookie
    session = new Session();
    session.restore();
    
    ui = new UI($("#content"), $("body"));
    
    
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

$(document).on("submit", "#login", function(e) { 
    e.preventDefault();
    login(); 
});

$(document).on("submit", "#newgame", function(e) { 
    e.preventDefault();
    newgame(); 
});

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
//        session.lobbyid = $(data).find("lobby > id").text();
//        session.currentstate = "lobby";
//        session.updateCookie();
//         
        $(data).find("lobby").append(cache.sets);
        var plainxml = $(data).toXml();
        var param = {"session": session.sessionid };
        var style = cache.lobby;
        
        $("#content").xslt(plainxml, style, param);
        
        // change set the first to be initialized
        //changeset();      
        //listener.subscribe(session.sessionid + "/lobby/" + session.lobbyid + "/events", refreshgame);

        // show lobby and subscribe...
        //showlobby();  
    });
}

function showlobby(subscribe) {
    $.get(apiurl + session.sessionid + "/lobby/" + session.lobbyid + "", function(data) {
        
        $(data).find("lobby").append(cache.sets);
        //console.log("Lobby: " + $(data).toXml());
        var param = {"session": session.sessionid };
        $("#content").xslt($(data).toXml(), cache.lobby, param);
        
        //ui.ready();

       if (subscribe === true) {
            session.currentstate = "lobby";
            session.updateCookie();
            listener.subscribe(session.sessionid + "/lobby/" + session.lobbyid + "/events", refreshgame);
       }

    });
}

function refreshgame(event) {
	//TODO check event type

    //$.get(apiurl + session.sessionid + "/lobby/" + session.lobbyid, function(data, status, xhr) {
    //    $("#content").xslt(xhr.responseText, cache.lobby, { "session" : session.sessionid });
    //});
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
