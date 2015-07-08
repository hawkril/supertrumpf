function LobbyEvent() {
	this.notfoundCallback = null;
	this.badrequestCallback = null;
	this.unauthorizedCallback = null;

	this.notfound = function(callback) {
		this.notfoundCallback = callback;
		return this;
	};

	this.badrequest = function(callback) {
		this.badrequestCallback = callback;
		return this;
	};

	this.unauthorized = function(callback) {
		this.unauthorizedCallback = callback;
		return this;
	}

	this.executeNotfound = function(obj) {

		if (this.notfoundCallback)
			return this.notfoundCallback(obj);

		return false;
	}

	this.executeBadrequest = function(obj) {

		if (this.badrequestCallback)
			return this.badrequestCallback(obj);

		return false;
	};

	this.executeUnauthorized = function(obj) {

		if (this.unauthorizedCallback)
			return this.unauthorizedCallback(obj);

		return false;
	};

	this.executeGamestarted = function(obj) {

	}



}