function Session() {
    this.state = 'login';
    this.user = null;
    this.session = null;
    this.lobby = null;
    this.set = null;


    this.updateCookie = function(obj) {
        if (obj) {
            if (!obj.user)
                this.user = obj.user;
            
            if (!obj.state)
                this.state = obj.state;
            
            if (!obj.session)
                this.session = obj.session;
            
            if (!obj.lobby)
                this.lobby = obj.lobby;
            
            if (!obj.set)
                this.set = obj.set;
        }
        
        document.cookie = "user=" + this.user;
        document.cookie = "session=" + this.session;
        document.cookie = "lobby=" + this.lobby;
        document.cookie = "state=" + this.state;
        document.cookie = "set=" + this.set;
    };

    this.clearCookie = function() {
        document.cookie = "user=";
        document.cookie = "session=";
        document.cookie = "lobby=";
        document.cookie = "state=";
        document.cookie = "set=";
    };

    this.restore = function() {
        this.session = this.getCookie("session");
        this.user = this.getCookie("user");
        this.lobby = this.getCookie("lobby");
        this.state = this.getCookie("state");
        this.set = this.getCookie("set");
    };

    this.getCookie = function(name) {
        var regex = new RegExp(name + "=(.[^;]+)");
        var match = document.cookie.match(regex);
        if (match)
            return match[1];
        return null;
    };
};

