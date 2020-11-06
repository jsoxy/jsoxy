module.exports = {
	match: /^\/user/,
	
	// add request headers
	// replace XXXXX with your access token
	headers: {
		Authorization: "token XXXXX"
	},
	
	// or add query parameters
	// use only one or another - no need to use both
	/*
	params: {
		access_token: "XXXXX"
	}
	*/
};
