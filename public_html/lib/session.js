function Session() {
    this.currentstate = 'login';
    this.username = null;
    this.sessionid = null;
    this.lobbyid = null;
    this.set = null;

    this.updateCookie = function() {
        document.cookie = "user="+ this.username;
        document.cookie = "session="+ this.sessionid;
        document.cookie = "lobby=" + this.lobbyid;
        document.cookie = "state=" + this.currentstate;
    };

    this.clearCookie = function() {
        document.cookie = "user=";
        document.cookie = "session=";
        document.cookie = "lobby=";
        document.cookie = "state=";
    };

    this.restore = function() {
        this.sessionid = this.getCookie("session");
        this.username = this.getCookie("user");
        this.lobbyid = this.getCookie("lobby");
        this.currentstate = this.getCookie("state");
    };

    this.getCookie = function(name) {
        var regex = new RegExp(name + "=(.[^;]+)");
        var match = document.cookie.match(regex);
        if (match)
            return match[1];
        return null;
    };
};

