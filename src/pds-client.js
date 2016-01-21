'use strict';

var https = require('https');
var mustache = require('mustache');
var commonTools = require('./common-tools');
var xml2js = require('xml2js');

module.exports=function(config) { return new PdsClient(config)} 

function PdsClient(config) {
	this.config = config;
}

PdsClient.prototype.simpleTrace = function (messageData, callback) {

	var messageName = "QUPA_IN000008UK02"	
	var template = this.config.templates[messageName] 
	
	var messageToSend = mustache.render(template, messageData);

	commonTools.consoleDumpObject('info', messageData.messageid, messageToSend)
	
	this.rawSend(messageToSend, messageName, function(err, result) {
		
        commonTools.consoleDumpObject('info', messageData.messageId, result)
		callback(err, result);
        
	});
};

PdsClient.prototype.rawSend=function(rawMessage, pdsQuery, callback) {
	var error = ""
	var result = ""
	
	var options = {
		pfx: this.config.pfxCertificate,
		passphrase: this.config.pfxPassPhrase,
		host: this.config.host,
		rejectUnauthorized: false,
		method: 'POST',
		path: '/sync-service',
		agent: false
	};

	var req = https.request(options, function (res) {
		res.on('error', function (err) {
			error = err;
		});

		res.on('data', function (chunk) {
			result += chunk
		});

		res.on('end', function () {
			callback(error, result);
		});
	});

	req.setHeader("SOAPAction", "urn:nhs:names:services:pdsquery/" + pdsQuery)
	req.setHeader("Content-Type", "text/xml")
	req.write(rawMessage)
	req.end();
}