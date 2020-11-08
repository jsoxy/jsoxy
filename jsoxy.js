'use strict';

const	Jsoxy = require('./index.js'),
	fs = require('fs');

const options = { editors: {} },
	path = process.cwd() + '/.jsoxy';
if (fs.existsSync(path)) {
	try { options = require(path + '/jsoxy.json'); } catch (e) {}
	if (!options.editors) options.editors = {};
	const files = fs.readdirSync(path, { encoding: 'utf8' });
	files.forEach((file, i) => {
		if (i = file.match(/(.*)\.js$/i)) {
			options.editors[i] = require(path + '/' + file);
		}
	});
}

options.target = process.argv[2] || options.target || 'https://api.github.com';
options.port = process.argv[3] || options.port || 8008;
options.strict = process.argv[4] === 'true' || options.strict || false;
console.log(options);
(new Jsoxy(options)).listen(options.port);

console.log('Jsoxy started on port ' + options.port
 + ' [' + options.target + '] with '
 + Object.keys(options.editors).length + ' editor(s).');
