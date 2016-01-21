'use strict';

var https = require('https');
var mustache = require('mustache');
var commonTools = require('./common-tools');

module.exports=function() { return new PdsClient()} 

function PdsClient() { }

PdsClient.prototype.simpleTrace = function (messageData, callback) {

		var testMessage = "<xml><dummy>message</dummy></xml>";
		
		callback(null, testMessage);
};