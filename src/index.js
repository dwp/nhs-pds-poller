'use strict';

//Dependancies
var express = require('express');
var configJson = require('./config.json');
var commonTools = require('./common-tools');
var workerService = require('./worker-service');
var fs = require('fs');

var pds = require('./pds-client.js');
var pdsFake = require('./pds-client-fake.sh');

// App and extensions
var app = express();

var pdsClientConfig = {
	pfxCertificate: fs.readFileSync(configJson.pdsConfig.pfxFileName),
	pfxPassPhrase: configJson.pdsConfig.pfxPassphrase,
	host: configJson.pdsConfig.host,
	templates: readTemplatesToArray('./pdstemplates')
}

function readTemplatesToArray(templatePath) {
	var files = {};

	console.log("Reading templates from:" + templatePath)

	fs.readdirSync(templatePath).forEach(function(filePath) {
		console.log("... loading template: " + filePath)
		files[filePath.replace('.xml', '').toUpperCase()] = fs.readFileSync(templatePath + '/' + filePath, "utf8")	
	});
	
	return files;
}

//Constants and settings
var PORT = (parseInt(configJson.workerServicePort)) ? parseInt(configJson.workerServicePort) : 9005;
var pdsClient = configJson.pdsConfig.useFakePds ? pdsFake() : pds(pdsClientConfig);

commonTools.systemEventDefaults(workerService.systemEventDefaultSettings());

app.use(commonTools.expressRawBodyFromData);

app.get('/', commonTools.forwardToSystemStatus);

app.get('/systemStatus', workerService.systemStatusPage);

app.post('/toggleDebugMode', commonTools.toggleDebugMode);

//Initialise
app.listen(PORT);

console.log(configJson.name + ": debugLevel=" + configJson.debugLevel)
console.log(configJson.name + ": Use fake pds(" + configJson.pdsConfig.useFakePds + ")")
console.log(configJson.name + ": Running on http://localhost:" + PORT + " ...")

workerService.setPdsClient(pdsClient);
workerService.startPolling();
