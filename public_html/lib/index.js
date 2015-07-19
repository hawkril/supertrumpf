var api = null;
var config = null;

$(document).ready(function() {   
	config 	= new Config("http://46.4.83.144:8888/api/", $("body"));	
    api 	= new Api(config);
    api.init();
    
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

$(document).on("click", ".lobby-item", function(e) {
    if (!e)
    	return;
    
    var id = $(e.currentTarget).attr("id");
    if (!id)
        return;

    api.joinLobby(id);
});