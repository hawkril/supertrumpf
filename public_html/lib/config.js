function Config(apiurl, node) {
	this.apiurl = apiurl;
	// timeout for a request... only nessesary, if server doesn't respond
	this.polltimeout = 5 * 60 * 1000;
	this.node = node;

	// delay first poll
	this.polldelay = 10 * 1000;

	this.minpolldelay = 2 * 1000;
};

