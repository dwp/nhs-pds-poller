//Mocha test file for workerService server

var configJson = require('../config.json');
var request = require('supertest');
var assert = require('assert');
var nconf = require('nconf');
var test = require('unit.js'); //includes 'should' module
var should = test.should; //or var should = require('should');

// Setup nconf defaults:
nconf.defaults({
	'workerServiceUrl': 'http://worker-service',
	'workerServicePort': configJson.workerServicePort
});
// Setup nconf to use (in-order):
//   1. Command-line arguments
//   2. Environment variables
//   3. A file located at 'path/to/config.json'
nconf.argv()
	.env();

var TEST_MODULE = 'Worker-Service Integration Tests';

var serverUrl = nconf.get('workerServiceUrl');
console.log(TEST_MODULE + ':serverUrl=' + serverUrl);
var serverPort = parseInt(nconf.get('workerServicePort'));
console.log(TEST_MODULE + ':serverPort=' + serverPort);
var serverUri = serverUrl + ':' + serverPort;

console.log(TEST_MODULE + ': serverUri=' + serverUri);

describe(TEST_MODULE, function() {

	before(function(done) {
		done();
	});
	after(function(done) {
		done();
	});

	describe('systemStatus', function() {

		it('should return basic server info', function(done) {
			request(serverUri)
			.get('/systemStatus')
			.expect(function(res) {
				test.should(res.statusCode).be.within(200, 201, 202, 302);

				test.should(res.headers['content-type']).be.equal('text/html');

				var responseText = res.text;

				test.should(responseText).be.html;
				test.should(responseText).containEql("<html>");
				test.should(responseText).containEql("</html>");
				test.should(responseText).containEql("<head>");
				test.should(responseText).containEql("</head>");
				test.should(responseText).containEql("<style>");
				test.should(responseText).containEql("</style>");
				test.should(responseText).containEql("<body class=\"hscicText\">");

				test.should(responseText).containEql("Citizen Identity Project");
				test.should(responseText).containEql("Worker-Service");
				test.should(responseText).containEql("Description");

				test.should(responseText).containEql("Service Info");
				test.should(responseText).containEql("Key");
				test.should(responseText).containEql("Value");
				test.should(responseText).containEql("Version");
				test.should(responseText).containEql("Author");
				test.should(responseText).containEql("Uptime");
				test.should(responseText).containEql("Debug level");

				test.should(responseText).containEql("Service System Events");
				test.should(responseText).containEql("Name");
				test.should(responseText).containEql("Value");
				test.should(responseText).containEql("First Poll Time");
				test.should(responseText).containEql("Most recent Poll");
				test.should(responseText).containEql("Most recent Poll Success");	
				test.should(responseText).containEql("Most recent Poll Error");
				test.should(responseText).containEql("Most recent Poll status");
				test.should(responseText).containEql("Most recent PDS Trace");
				test.should(responseText).containEql("Most recent PDS Trace success");
				test.should(responseText).containEql("Most recent PDS Trace error");
				test.should(responseText).containEql("Most recent PDS Trace status");
				test.should(responseText).containEql("PDS Items since last restart");
				test.should(responseText).containEql("PDS Successes since last restart");
				test.should(responseText).containEql("PDS Errors since last restart");
				
				test.should(responseText).containEql("</body>");
			})
			// end handles the response
			.end(function(err, res) {
				if (err) return done(err);
				done();
			});
		});

	});
});