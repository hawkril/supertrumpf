var api = null;
var config = null;

$(document).ready(function() {   
	config 	= new Config("http://46.4.83.144:8888/api/", $("body"));	
    api 	= new Api(config);
    api.init();


    // return to state in cookie
//    switch (session.currentstate) {
//        case "lobbies":
//            if (session.sessionid) {
//                showlobbies();
//                return;
//            }
//            break;
//        case "lobby":
//            if (session.sessionid && session.lobbyid) {
//                showlobby();
//                return;
//            }
//            break;
//    }
    
    api.showLogin();
    
});

$(document).on("submit", "#login", function(e) { 
    e.preventDefault();
    var name = $("#username").val();
    if (name === "")
        return;
    
    api.login(name); 
});

$(document).on("submit", "#newgame", function(e) {
	e.preventDefault();
    var name = $("#gamename").val();
	if (!name)
	    return;

	api.createLobby(name);
});

$(document).on("click", ".lobby", function(e) {
    if (!e)
    	return;
    
    var id = $(e.currentTarget).attr("id");
    if (!id)
        return;

    api.joinLobby(id);
});