function Session() {
    this.state = 'login';
    this.user = null;
    this.id = null;


    this.signedIn = function() {
        return this.user !== "" && this.session !== "";
    }

    this.updateCookie = function(obj) {
        if (obj) {
            if (obj.user)    this.user      = obj.user;
            if (obj.state)   this.state     = obj.state; 
            if (obj.id)      this.id        = obj.id;
        }
        
        document.cookie = "session.user="   + this.user;
        document.cookie = "session.state="  + this.state;
        document.cookie = "session.id="     + this.id;
    }

    this.clearCookie = function() {
        document.cookie = "session.user=";
        document.cookie = "session.state=";
        document.cookie = "session.id=";
    };

    this.restore = function() {
        this.user   = this.getCookie("session.user");
        this.state  = this.getCookie("session.state");
        this.id     = this.getCookie("session.id");
    };

    this.getCookie = function(name) {
        var regex = new RegExp(name + "=(.[^;]+)");
        var match = document.cookie.match(regex);
        if (match)
            return match[1];
        return null;
    };
};

