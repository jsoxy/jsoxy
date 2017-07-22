# Jsoxy
Clever JSON Proxy Server

- Async Editing JSON data on-the-fly using Promises
- Gzip & Deflate Compression

Usage example:

```
const Jsoxy = require('jsoxy');

// URL to proxy (without trailing slash)
const target = 'http://localhost:4000';

// Port to run proxy server
const port = 4001;

(new Jsoxy({
	target: target,
	editors: {
		
		// arbitrary name of editor
		name: {
			
			// matching to requested URI
			match: /\/api/,
			
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

For now only GET requests are supported.
