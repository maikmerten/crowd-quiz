var auth = require('basic-auth');
var admins = {};
var authEnabled = true;

module.exports = {
	addAdmin: function(username, password) {
		if(!username || !password) {
			return;
		}
		admins[username] = { password: password};
	},

	handleRequest: function(req, res, next) {
		if(!authEnabled) {
			return next();
		}

		var user = auth(req);
		if (!user || !admins[user.name] || admins[user.name].password !== user.pass) {
			res.set('WWW-Authenticate', 'Basic realm="CrowdQuiz"');
			return res.status(401).send();
		}
		return next();
	},

	setAuthEnabled: function(enableFlag) {
		authEnabled = enableFlag;
	}
};
