# Jsoxy [![Build Status](https://travis-ci.org/jsoxy/jsoxy.png?branch=master)](https://travis-ci.org/jsoxy/jsoxy) [![npm version](https://badge.fury.io/js/jsoxy.png)](https://npmjs.org/package/jsoxy)
Clever JSON Proxy Server

- Async Editing JSON data on-the-fly using Promises
- Gzip & Deflate Compression
- URL re-write using Regular Expressions

For now only GET requests are supported.
Pull requests are pretty much welcomed!

```
npm install jsoxy
```

Usage example:

```
const Jsoxy = require('jsoxy');

// URL to proxy (without trailing slash)
const target = 'http://localhost:4000/api';

// Port to run proxy server
const port = 4001;

(new Jsoxy({
	target: target,
	
	// whether to serve unmatched URIs
	// defaults to false (pass-thru), if true - 403 error
	strict: false,
	
	editors: {
		
		// arbitrary name of editor
		name: {
			
			// matching to requested URI
			match: /\/items\/(.+)/,
			
			// replace macthed URI using regexp
			replace: '/real-items-path/?id=$1',
			
			// method name below is corresponding to the request's method
			get: function(body) {
				
				// ASYNC modify response object
				return new Promise((resolve, reject) => {
					body = {key: 'value'};
					resolve(body);
				});
				
				// SYNC modify response object
				body = {key: 'value'};
				return Promise.resolve(body);
			}
		}
	}
})).listen(port);

console.log('Proxy started on port ' + port + ' (target ' + target + ')');

```
