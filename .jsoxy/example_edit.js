module.exports = {
	
	// match /jsoxy URI
	match: /^\/jsoxy$/,
	
	// replace
	replace: '/orgs/jsoxy',
	
	// editor for GET request
	get: function(body) {
		
		// convert updated_at date format into a timestamp
		body.updated_at = Date.parse(body.updated_at);
		
		// add a new key to the body
		body.WELCOME_TO = 'JSOXY';
		
		// always return a promise
		return Promise.resolve(body);
	}
};
