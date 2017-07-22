const	http = require('http'),
		request = require('request'),
		url = require('url'),
		zlib = require('zlib');

module.exports = class Jsoxy {
	
	constructor(options) {
		
		if (!options.target) throw new Error('Target URL is required for Jsoxy to start!');
		
		if (options.editors) this.editors = options.editors;
		
		return http.createServer((req, res) => {

			const send = this.sender(req, res);
			const method = req.method.toLowerCase();
	
			switch (method) {
				case 'get':
					request(options.target + url.parse(req.url).path, (err, proxy, input) => {								
						if (err) {
							send(err, null, 502);
						}
						else {
							try {
								this.responder(req, res)(method, input, send);
							}
							catch (err) {
								send(err);
							}
						}
					});
				break;
				default:
					send(null, null, 405);
				break;
			}
	
		});
	};
	

	responder(req, res) {
		
		return (method, input, send) => {
			const body = JSON.parse(input);
			let promise = Promise.resolve(body);
			for (let i in this.editors) {
				if (url.parse(req.url).pathname.match(this.editors[i].match) && typeof this.editors[i][method] === 'function') {
					promise = this.editors[i][method](body);
					break;
				}
			}
			promise
				.then(body => send(null, JSON.stringify(body)))
				.catch(err => send(err));
		};
	};
	
	
	sender(req, res) {
		
		return (err, data, code, message, headers) => {
	
			const _send = (err, data, code, message, headers) => {
				if (!data) data = '';
				res.setHeader('Content-Length', Buffer.byteLength(data, 'utf-8'));
				res.setHeader('Content-Type', 'application/json; charset=utf-8');
				res.setHeader('Access-Control-Allow-Origin', '*');
				res.setHeader('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
				res.setHeader('Expires', 'Thu, 01 Jan 1970 00:00:00 GMT');
				res.setHeader('X-Powered-By', 'Jsoxy');
				res.writeHead(code || (err ? 500 : 200), message || '', headers);
				res.end(data, 'utf-8', () => {
					console.log(new Date, req.url);
					if (err) console.log('Server Error:', err);
				});
			};
	
			if ('accept-encoding' in req.headers) {
				const encodings = req.headers['accept-encoding'].split(',').map(str => str.trim().toLowerCase());
				let encoded = false;
				for (let encoding of ['deflate', 'gzip']) {
					if (encodings.includes(encoding)) {
						zlib[encoding](new Buffer(data || '', 'utf-8'), (e, data) => {
							res.setHeader('Content-Encoding', encoding);
							_send(e || err, data, code, message, headers);
						});
						encoded = true;
						break;
					}
				}
				if (!encoded) {
					_send(err, data, code, message, headers);
				}
			}
			else {
				_send(err, data, code, message, headers);
			}
		};
	};
	
};
