var api = null;

$(document).ready(function() {   
    api = new Api("http://46.4.83.144:8888/api/", $("body"));
    
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

