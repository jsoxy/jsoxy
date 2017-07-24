'use strict';

const	http = require('http'),
		request = require('request'),
		url = require('url'),
		zlib = require('zlib');

module.exports = class Jsoxy {
	
	constructor(options) {
		
		if (!options.target) throw new Error('Target URL is required for Jsoxy to start!');
		this.strict = !!options.strict;
		this.editors = options.editors || {};
		
		return http.createServer((req, res) => {
			res.url = options.target + url.parse(req.url).path;
			this.responder(req, res)(this.sender(req, res));
		});
	};
	

	responder(req, res) {
		
		return (send) => {

			const method = req.method.toLowerCase();
			let editor = null;
			
			for (let i in this.editors) {
				if (url.parse(req.url).pathname.match(this.editors[i].match) && typeof this.editors[i][method] === 'function') {
					editor = this.editors[i][method];
					if (this.editors[i].replace) res.url = res.url.replace(this.editors[i].match, this.editors[i].replace);
					break;
				}
			}
			if (editor || !this.strict) {
				request(res.url, (err, proxy, input) => {
					if (err) {
						send(err, null, 502);
					}
					else {
						try {
							const body = JSON.parse(input);
							(editor ? editor(body) : Promise.resolve(body))
								.then(body => send(null, JSON.stringify(body), proxy.statusCode, proxy.statusMessage, proxy.headers))
								.catch(err => send(err));
						}
						catch (err) {
							send(err);
						}
					}
				});
			}
			else {
				send(null, null, 403);
			}
		};
	};
	
	
	sender(req, res) {
		
		return (err, data, code, message, headers) => {
	
			const _send = (err, data, code, message, headers, encoding) => {
				if (!data) data = '';
				if (!headers) headers = {};
				if (encoding) headers['content-encoding'] = encoding;
				headers['content-length'] = Buffer.byteLength(data, 'utf-8');
				headers['x-powered-by'] = 'Jsoxy';
				
				for (let i in headers) {
					let c = i.replace(/\b\w/g, i => i.toUpperCase());
					headers[c] = headers[i];
					if (c !== i) delete headers[i];
				}
				
				res.writeHead(code || (err ? 500 : 200), message || '', headers);
				res.end(data, 'utf-8', () => {
					console.log(new Date + ': ' + req.method + ' ' + req.url + '\n > ' + res.url);
					if (err) console.log('Server Error:', err);
				});
			};
			
			let encoded = false;
			if ('accept-encoding' in req.headers) {
				const encodings = req.headers['accept-encoding'].split(',').map(str => str.trim().toLowerCase());
				for (let encoding of ['deflate', 'gzip']) {
					if (encodings.includes(encoding)) {
						zlib[encoding](new Buffer(data || '', 'utf-8'), (e, data) => {
							_send(e || err, data, code, message, headers, encoding);
						});
						encoded = true;
						break;
					}
				}
			}
			if (!encoded) {
				_send(err, data, code, message, headers);
			}
		};
	};
	
};
