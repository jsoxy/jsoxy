'use strict';

const	http = require('http'),
		request = require('request'),
		url = require('url'),
		zlib = require('zlib');

module.exports = class Jsoxy {
	
	constructor(options) {
		
		if (!options || !options.target) throw new Error('Target URL is required for Jsoxy to start!');
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
			const headers = { 'User-Agent': 'Jsoxy' };
			let editor = null;
			
			for (let i in this.editors) {
				if (url.parse(req.url).pathname.match(this.editors[i].match)) {
					editor = this.editors[i];
					if (editor.replace) {
						res.url = url.resolve(res.url, url.parse(req.url).pathname.replace(editor.match, editor.replace));
					}
					if (editor.params) {
						for (let p in editor.params) {
							res.url += (~res.url.indexOf('?') ? '&' : '?') + (p + '=' + encodeURIComponent(editor.params[p]));
						}
					}
					if (editor.headers) {
						for (let h in editor.headers) {
							headers[h] = editor.headers[h];
						}
					}
					break;
				}
			}
			if (editor || !this.strict) {
				request({
					url: res.url,
					headers: headers
				}, (err, proxy, input) => {
					if (err) {
						send(err, null, 502);
					}
					else {
						try {
							const body = JSON.parse(input);
							(editor && (typeof editor[method] === 'function') ? editor[method](body) : Promise.resolve(body))
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
					if (err) console.error('Jsoxy Error:', err);
				});
			};
			
			let encoded = false;
			if ('accept-encoding' in req.headers) {
				const encodings = req.headers['accept-encoding'].split(',').map(str => str.trim().toLowerCase());
				for (let encoding of ['deflate', 'gzip']) {
					if (encodings.includes(encoding)) {
						zlib[encoding](Buffer.from(data || '', 'utf-8'), (e, data) => {
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
