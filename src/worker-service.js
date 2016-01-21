'use strict';

//Dependancies
var request = require('request');
var express = require('express');
var configJson = require('./config.json');
var commonTools = require('./common-tools');
var xml2js = require('xml2js');

//Constants and settings
var pollIntervalMillis = parseInt(configJson.workerServicePollIntervalMillis);
var loggedOldestSuccessfullPoll = false;
var pdsClient;

// ========================================================
// worker-service.js
// A library of functions for the Worker service
// MM & IP, Sept 2015
// ========================================================
module.exports = {
	
	systemEventDefaultSettings: function (){
		return {
			'First Poll Time'  : 'n/a',
			'Most recent Poll'  : 'n/a',
			'Most recent Poll Success'  : 'n/a',	
			'Most recent Poll Error'  : 'n/a',
			'Most recent Poll status' : 'n/a',
			'Most recent PDS Trace'  : 'n/a',
			'Most recent PDS Trace success'  : 'n/a',
			'Most recent PDS Trace error'  : 'n/a',
			'Most recent PDS Trace status'  : 'n/a',
			'PDS Items since last restart'  : 0,
			'PDS Successes since last restart'  : 0,
			'PDS Errors since last restart' : 0
		};
	}
	, //next function
	
	systemStatusPage: function (req, res) {
		var queryParams = commonTools.queryParameters(req.query);
		if (queryParams.rawJsonOnly) {
			var indexJson = commonTools.renderIndexPage(req.query);
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify(indexJson));
		} else {
			var indexPageHtml = commonTools.renderIndexPage(req.query);
			res.setHeader('Content-Type', 'text/html');
			res.send(indexPageHtml + commonTools.htmlPagePostfix());
		}
	}
	, //next function
	
	startPolling: function (){
		setInterval(module.exports.poll, pollIntervalMillis);
		console.log(configJson.name + ": polling every " + pollIntervalMillis + "ms to " + verifyToPdsBridgePortUri() + " ...")
	}
	, //next function
	
	setPdsClient: function(client) {
		pdsClient = client
	}
	, //next function 
	
	poll: function() {
		var pollOptions = buildOptions(configJson.dequeueFromBridgeToWorkerMethod, {} );
		
        request.get(pollOptions, onCheckBridgeQueuePollComplete);
		
		function onCheckBridgeQueuePollComplete (err, response, body) {
            
			commonTools.systemEvent('Most recent Poll');
            
			if (!loggedOldestSuccessfullPoll){
				commonTools.systemEvent('First Poll Time');
				commonTools.consoleDumpText('info'	, 'poll.onCheckBridgeQueuePollComplete', 'Success connecting for queue data to ' + pollOptions.uri);
				loggedOldestSuccessfullPoll = true;
			}
            
			if (err || response.statusCode != 200){
				commonTools.systemEvent('Most recent Poll Error');
				commonTools.systemEventData('Most recent Poll status', 'Error polling Bridge: ' + commonTools.prettyPrintError(err));
				loggedOldestSuccessfullPoll = false;
				var logMe = { 'targets' : { 
						'verifyToPdsBridgePortUri' : verifyToPdsBridgePortUri(),
						'dequeueFromBridgeToWorkerMethod' : configJson.dequeueFromBridgeToWorkerMethod,
						'enqueueFromWorkerBackToBridgeMethod' : configJson.enqueueFromWorkerBackToBridgeMethod
					},
					'err' : commonTools.prettyPrintError(err)
				};
				if (response) {
					logMe.statusCode = response.statusCode;
				}
				commonTools.consoleDumpObject('error', 'poll.err', logMe );
				return;
			}
            
			commonTools.systemEvent('Most recent Poll Success');
			commonTools.systemEventData('Most recent Poll status', 'OK polling Bridge');
			body.forEach(module.exports.processMessage);
		}
	}
	, //next function
	
	processMessage: function (queueItem) {
		commonTools.consoleDumpObject('debug', 'processMessage:Started', queueItem);
		commonTools.systemEvent('Most recent PDS Trace');
		commonTools.systemEventPlusOne('PDS Items since last restart');
					
		pdsClient.simpleTrace(queueItem, onPdsLookupFinish);
	
		function onPdsLookupFinish (err, pdsResult){
			
			var returnData = {
				//our link
				'correlationId' : queueItem.correlationId,
				'pdsData' : pdsResult
			}
			
			commonTools.consoleDumpObject('info', 'processMessage:PdsResult', pdsResult);
			request.post(buildOptions(configJson.enqueueFromWorkerBackToBridgeMethod, returnData), onProcessMessagePostComplete);
			
			function onProcessMessagePostComplete (err, response, body) {
				if (err){
					commonTools.systemEvent('Most recent PDS Trace error');
					commonTools.systemEventPlusOne('PDS Errors since last restart');
					commonTools.systemEventData('Most recent PDS Trace status', 'ERROR in post: ' + commonTools.prettyPrintError(err));
					commonTools.consoleDumpError('error', 'onProcessMessagePostComplete.err', err);
				} else if (response.statusCode == 200) {
					commonTools.systemEvent('Most recent PDS Trace success');
					commonTools.systemEventPlusOne('PDS Successes since last restart');
					commonTools.systemEventData('Most recent PDS Trace status', 'OK posting');
					commonTools.consoleDumpObject('info', 'processMessage:Finished',  { 'gdsQueueItem' : queueItem, 'pdsResult' : pdsResult });
				}
			}
		}
	}//next function	
}; //end exported methods

//private methods go here
function verifyToPdsBridgePortUri() {
	return configJson.verifyToPdsBridgeUrl + ':' + configJson.verifyToPdsBridgePort + '/';
};

function buildOptions(targetUri, messagebody) {
	return { uri: verifyToPdsBridgePortUri() + targetUri,
		method: 'GET',
		json: true,
		body: messagebody
		}
};