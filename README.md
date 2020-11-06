# Jsoxy [![Build Status](https://travis-ci.org/jsoxy/jsoxy.png?branch=master)](https://travis-ci.org/jsoxy/jsoxy) [![npm version](https://badge.fury.io/js/jsoxy.png)](https://npmjs.org/package/jsoxy)
Clever JSON Proxy Server

- Async Editing JSON data on-the-fly using Promises
- Gzip & Deflate Compression
- URL re-write using Regular Expressions
- Injection of Query Parameters
- Injection of Request Headers

Jsoxy can be used as a proxy server for any JSON API, when it is needed to modify data on-the fly.

Common use case is a microservice architecture, where old API responses have to be changed into a new format.

Another usage is to re-write URIs or inject query parameters or headers (Authorization, for example).

Data editing is done using Promises, which means it can be done asynchronously, greatly expanding its capabilities.

Starting from version 1.1.1, Jsoxy supports standalone mode with flexible configuration using `.jsoxy` directory (more info below).

For now only GET requests are supported.
Pull requests are pretty much welcomed!

```
npm install jsoxy
```

##Tutorial

###Standalone server with `.jsoxy` directory for configuration

Right after the installation, move `.jsoxy` directory from `node_modules/jsoxy` to the root of your project:

```
mv node_modules/jsoxy/.jsoxy .
```

This special directory contains the main `jsoxy.json` config file, along with one or many `.js` files, used as editors.

Default `jsoxy.json` is very simple:

```
{
  "target": "https://api.github.com",
  "port": 8008,
  "strict": false
}
```

GitHub API here is used just as an example, it can be any JSON API instead.

- **target**
	-- is an URL to the JSON API to proxy (without trailing slash).

- **port**
	-- is for Jsoxy to listen to.

- **strict**
	-- means that you don't want to serve URIs that don't match to any editor (pass-thru without changes).
	If `strict` is `true`, error 403 (Access Denied) will be served instead of an unchanged API response.

You can set your parameters in the `jsoxy.json` file and then just run:

```
node node_modules/jsoxy/jsoxy
```

Target and Port can be overridden via command line parameters:

```
node node_modules/jsoxy/jsoxy http://api.github.com 8080
```

####Setting up Editors

`.jsoxy` directory can contain `.js` files, used as editors. Editor is just a module object with parameters:

- **match**
	-- regular expression to match requesting URI pathname (MANDATORY)
- **replace**
	-- string to replace the match with (e.g. `/items/(.*)` > `/items/?id=$1`)
- **get**
	-- editor function itself, used to modify the `body` coming as the only argument.
- **params**
	-- object contains any number of query parameters to be added to the request URI (`access_token` for example)
- **headers**
	-- object contains any number of headers to be added to the request (`Authorization` for example)

#####Simple editor examples

If you need to change the Date format into a Timestamp, it's easy with Jsoxy:

```
{
	match: /^\/jsoxy$/,
	
	replace: '/orgs/jsoxy',
	
	get: function(body) {
		
		// convert updated_at date format into a timestamp
		body.updated_at = Date.parse(body.updated_at);
		
		return Promise.resolve(body);
	}
}
```

When you open `http://localhost:8008/jsoxy`, you'll get a modified response from GitHub API `/orgs/jsoxy` URI with `updated_at` field as a timestamp (compare to `created_at`).

---

If you need to hide your access token from end users, it's done like this:

```
{
	match: /^\/user/,
	
	// replace XXXXX with your access token
	headers: {
		Authorization: "token XXXXX"
	}
}
```

Complete examples can be found inside the `.jsoxy` directory of this repo.

**PLEASE NOTE** that the path to `.jsoxy` directory is computed relatively to the **current working directory**.

This allows for different configurations to be used with the same Jsoxy instance.


###Using as a script

Jsoxy can be also used as a part of your application.

In this case config and editors are specified directly at initialization:

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
		
		// arbitrary name of editor (items in this case)
		items: {
			
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
				
				// or SYNC modify response object
				body = {key: 'value'};
				return Promise.resolve(body);
			}
		}
	}
})).listen(port);
```
