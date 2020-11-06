'use strict';

const	Jsoxy = require('./index.js'),
	fs = require('fs');

var options = { editors: {} };

const path = process.cwd() + '/.jsoxy';
if (fs.existsSync(path)) {
	const _read = path => {
		try {
			return JSON.parse(fs.readFileSync(path, 'utf8'));
		}
		catch (err) {
			console.error(err);
			return null;
		}
	};
	
	const optFile = path + '/jsoxy.json';
	options = fs.existsSync(optFile) ? _read(optFile) : {};
	
	if (!options.editors) options.editors = {};
	const files = fs.readdirSync(path, { encoding: 'utf8' });
	files.forEach(file => {
		if (file.match(/\.js$/)) options.editors[file.replace(/\.js$/, '')] = require(path + '/' + file);
	});
}

options.target = process.argv[2] || options.target || 'https://api.github.com';
options.port = process.argv[3] || options.port || 8008;

const jsoxy = new Jsoxy(options);
jsoxy.listen(options.port);
console.log('Jsoxy started on port ' + options.port + ' [' + options.target + '] with ' + Object.keys(options.editors).length + ' editor(s).');
