function Response() {
	this.doneCallback = null;

	this.done = function(callback) {
		this.doneCallback = callback;
		return this;
	}

	this.executeDone = function(obj1, obj2) {
		if (this.doneCallback)
			return this.doneCallback(obj1, obj2);

		return null;
	}


}