//Mocha test file for VerifyToPdsBridge server

var testUtils = require('./unitTestUtilities');
var configJson = require('../config.json');
var packageJson = require('../package.json');
var commonTools = require('../common-tools');
var assert = require('assert');
var test = require('unit.js'); //includes 'should' module
var should = test.should; //or var should = require('should');
var httpMocks = require('node-mocks-http');


describe('CommonTools-UnitTests', function() {

	before(function(done) {
		commonTools.dateForNow = function(){
			return testUtils.testDate();
		};
		done();
	});

	after(function(done) {
		done();
	});
	
	beforeEach(function(done) {
		commonTools.clearSystemEvents();
		commonTools.initialise();
		commonTools.silentSetDebugLevel('debug');
		done();
	});

	afterEach(function(done) {
		done();
	});

	describe('isInt', function() {
		//see http://stackoverflow.com/a/14794066
		it('should give valid answers only for numeric integers', function(done) {			
			test.should(commonTools.isInt(42)       ).be.ok; // true
			test.should(commonTools.isInt("42")     ).be.ok; // true
			test.should(commonTools.isInt(4e2)      ).be.ok; // true
			test.should(commonTools.isInt("4e2")    ).be.ok; // true
			test.should(commonTools.isInt(" 1 ")    ).be.ok; // true
			test.should(commonTools.isInt("")       ).not.be.ok; // false
			test.should(commonTools.isInt("  ")     ).not.be.ok; // false
			test.should(commonTools.isInt(42.1)     ).not.be.ok; // false
			test.should(commonTools.isInt("1a")     ).not.be.ok; // false
			test.should(commonTools.isInt("4e2a")   ).not.be.ok; // false
			test.should(commonTools.isInt(null)     ).not.be.ok; // false
			test.should(commonTools.isInt(undefined)).not.be.ok; // false
			test.should(commonTools.isInt(NaN)      ).not.be.ok; // false
			done();
		});
	});
	
	describe('dataMapWithOverrides', function() {
		
		var resultMap;
		
		beforeEach(function(done) {		
			resultMap = commonTools.dataMapWithOverrides( { 'alice' : 'false', 'bob' : 'false' } , { 'bob' : 'true' , 'charles' : 'other' } );
			done(); 
		});
		
		it('should override default values with given overrides', function(done) {		
			test.should(resultMap.bob).be.a.Boolean.and.be.ok;
			done();
		});
		
		it('should leave other strings as strings', function(done) {	
			test.should(resultMap.charles).be.a.String.and.be.equal('other');
			done();
		});
		
		it('should convert true/false strings to booleans', function(done) {		
			test.should(resultMap.alice).be.a.Boolean.and.not.be.ok;
			test.should(resultMap.bob).be.a.Boolean.and.be.ok;
			done();
		});
	});
	
	describe('queryParameters', function() {
		
		var defaultMap;
		var resultMap;
		
		beforeEach(function(done) {		
			defaultMap = commonTools.queryParameters();
			resultMap = commonTools.queryParameters( { 'showServiceInfo' : 'false', 'showSystemEvents' : 'false', 'showExtraInfo' : 'false', 'rawJsonOnly' : 'true' } );
			done(); 
		});
		
		it('should have default values', function(done) {
			test.should(defaultMap.showServiceInfo).be.a.Boolean.and.be.ok;
			test.should(defaultMap.showSystemEvents).be.a.Boolean.and.be.ok;
			test.should(defaultMap.showExtraInfo).be.a.Boolean.and.be.ok;
			test.should(defaultMap.rawJsonOnly).be.a.Boolean.and.not.be.ok;
			done();
		});
		
		it('should override default values with given overrides', function(done) {		
			test.should(resultMap.showServiceInfo).be.a.Boolean.and.not.be.ok;
			test.should(resultMap.showSystemEvents).be.a.Boolean.and.not.be.ok;
			test.should(resultMap.showExtraInfo).be.a.Boolean.and.not.be.ok;
			test.should(resultMap.rawJsonOnly).be.a.Boolean.and.be.ok;
			done();
		});
	});
	
	describe('forwardToSystemStatus', function() {
		var mockRequest;
		var mockResponse;
		
		beforeEach(function(done) {
			mockRequest  = httpMocks.createRequest({
				method: 'GET',
				url: '/',
				params: {}
			});
			mockResponse = httpMocks.createResponse();
			
			commonTools.forwardToSystemStatus(mockRequest, mockResponse);
			done();
		});
		
		it('should end the chain', function(done) {			
			test.should(mockResponse._isEndCalled()).be.ok;
			done();
		});
		
		it('should forward the caller to the systemStatus url', function(done) {		
			test.should(mockResponse.statusCode).be.equal(302);
			test.should(mockResponse.getHeader('Location')).be.equal('/systemStatus');
			done();
		});
	});
	
	describe('prettyPrintError', function() {
		
		var errorTextGood;
		var errorTextEmpty;
		var errorTextEmptyNoMessage;
		var errorTextComplexMessage;
		var errorTextEncodedMessage;
		
		beforeEach(function(done) {			
			errorTextGood = commonTools.prettyPrintError(new Error('a-message'));
			errorTextEmpty = commonTools.prettyPrintError({});
			var emptyNoMessage = new Error();
			errorTextEmptyNoMessage = commonTools.prettyPrintError(emptyNoMessage);
			errorTextComplexMessage = commonTools.prettyPrintError(new Error('a-message with   double spaces and \n line \n breaks'));
			errorTextEncodedMessage = commonTools.prettyPrintError(new Error('special < > & ; % charcters'));
			done();
		});
		
		it('should contain type (from name) and message', function(done) {			
			test.should(errorTextGood).be.equal('Type=Error, Message=a-message');
			done();
		});
		it('should contain defaults when empty', function(done) {			
			test.should(errorTextEmpty).be.equal('Type=Error, Message=undefined');
			done();
		});
		it('should contain defaults when empty', function(done) {			
			test.should(errorTextEmptyNoMessage).be.equal('Type=Error, Message=undefined');
			done();
		});
		it('should contain normalised message strings', function(done) {			
			test.should(errorTextComplexMessage).be.equal('Type=Error, Message=a-message with double spaces and line breaks');
			done();
		});
		it('should html encode special characters', function(done) {			
			test.should(errorTextEncodedMessage).be.equal('Type=Error, Message=special &lt; &gt; &amp; ; % charcters');
			done();
		});
		it('should default when not object is passed or object is null', function(done) {			
			test.should(commonTools.prettyPrintError()).be.equal('Type=not-set, Message=not-set');
			test.should(commonTools.prettyPrintError(null)).be.equal('Type=not-set, Message=not-set');
			done();
		});
	});
	
	describe('expressRawBodyFromData', function() {
		context('should extend the request object', function() {
			
			var mockRequest;
			
			beforeEach(function(done) {
				mockRequest = httpMocks.createRequest({
					method: 'GET',
					url: '/',
					params: {}
				});
				testUtils.extendMockRequestWithExpressHelperMethods(mockRequest);
				var mockResponse = httpMocks.createResponse();
				
				commonTools.expressRawBodyFromData(mockRequest, mockResponse, mockRequest.mockNextFunction);
				done();
			});
			
			it('and set the raw body with hooks to set it from data', function(done) {			
				test.should(mockRequest).have.property('rawBody', '');
				test.should(mockRequest.encodingCharsCalled).be.ok;
				test.should(mockRequest.encodingCharsValue).be.equal('utf8');
				test.should(mockRequest.onTypes['data']).be.a.Function;
				test.should(mockRequest.onTypes['end']).be.a.Function;
				done();
			});
			
			it('and call the next() function on end', function(done) {			
				test.should(mockRequest.nextCalled).not.be.ok;
				mockRequest.onTypes['end']();
				test.should(mockRequest.nextCalled).be.ok;
				done();
			});
			
			it('and only update the raw body on a data call', function(done) {			
				test.should(mockRequest).have.property('rawBody', '');
				mockRequest.onTypes['data']('append-me');
				test.should(mockRequest).have.property('rawBody', 'append-me');				
				done();
			});
		});
	});
	
	describe('DebugMode functions', function() {
		context('setDebugMode and getDebugMode', function() {
			
			it('should be symmetric', function(done) {
				test.should(commonTools.getDebugLevel()).not.be.equal('new-level');
				
				commonTools.silentSetDebugLevel('new-level');
				
				test.should(commonTools.getDebugLevel()).be.equal('new-level');
				done();
			});
		});
		
		context('toggleDebugMode', function() {
			var mockResponse;
			
			beforeEach(function(done) {
				commonTools.silentSetDebugLevel('old-level');
				test.should(commonTools.getDebugLevel()).be.equal('old-level');

				var mockRequest  = httpMocks.createRequest({
					method: 'POST',
					url: '/toggleDebugMode',
					body: 'not-used'
				});
				mockRequest.rawBody = 'new-debug-level'
				mockResponse = httpMocks.createResponse();
				
				commonTools.toggleDebugMode(mockRequest, mockResponse);
				done();
			});
				
			it('should set the debug mode from the rawBody', function(done) {			
				test.should(commonTools.getDebugLevel()).be.equal('new-debug-level');
				done();
			});
				
			it('should forward to the service status page', function(done) {	
				test.should(mockResponse._isEndCalled()).be.ok;
				test.should(mockResponse.statusCode).be.equal(302);
				test.should(mockResponse.getHeader('Location')).be.equal('/systemStatus');
				done();
			});
		});
	});
	
	describe('dateForNow', function() {

		it('should be overloaded with a fixed value for tests', function(done) {
			var result = commonTools.dateForNow();
			test.should(result).be.type('object');
			test.should(result.valueOf()).be.equal(9876543210);
			test.should(result.toString()).be.equal('Sat Apr 25 1970 08:29:03 GMT+0100 (GMT Summer Time)');
			done();
		});
	});

	describe('uptime functions', function() {
		context('uptimeWithDays', function() {
			it('should return the uptime in whole days, the remainder in hh:mm:ss, and the date stamp', function(done) {
				var result = commonTools.uptimeWithDays(new Date(9876543210 * 2));
				test.should(result).be.type('string');
				test.should(result.toString()).be.equal('114 days and 08:29:03 since 1970-04-25T08:29:03');
				done();
			});
		});
		
		context('uptimeWithDaysToNow', function() {
			it('should return the uptime in whole days, the remainder in hh:mm:ss, and the date stamp', function(done) {
				var result = commonTools.uptimeWithDaysToNow();
				test.should(result).be.type('string');
				test.should(result.toString()).be.equal('00 days and 00:00:00 since 1970-04-25T08:29:03');
				done();
			});
		});
	});

	describe('xsDateTime handling functions', function() {
		
		context('xsDateTimeFormat', function() {
			it('should return a standard format of the prescribed date and time', function(done) {
				var result = commonTools.xsDateTimeFormat(testUtils.testDate());
				test.should(result).be.type('string');
				test.should(result).be.equal('1970-04-25T08:29:03');
				done();
			});
		});
		
		context('xsDateFormat', function() {
			it('should return a standard format of the prescribed date', function(done) {
				var result = commonTools.xsDateFormat(testUtils.testDate());
				test.should(result).be.type('string');
				test.should(result).be.equal('1970-04-25');
				done();
			});
		});
		
		context('xsTimeFormat', function() {
			it('should return a standard format of the prescribed time', function(done) {
				var result = commonTools.xsTimeFormat(testUtils.testDate());
				test.should(result).be.type('string');
				test.should(result).be.equal('08:29:03');
				done();
			});
		});
		
		context('nowAsXsDateTimeFormat', function() {
			it('should return a standard format of the prescribed date and time', function(done) {
				var result = commonTools.nowAsXsDateTimeFormat();
				test.should(result).be.type('string');
				test.should(result).be.equal('1970-04-25T08:29:03');
				done();
			});
		});
	});

	describe('indexPage handling functions', function() {
		
		beforeEach(function(done) {
			commonTools.clearSystemEvents();
			done();
		});
		
		context('htmlPagePostfix', function() {
			it('should return the footer html with the test date', function(done) {
				var result = commonTools.htmlPagePostfix();
				test.should(result).be.type('string');
				test.should(result).be.html;
				test.should(result).be.equal('<hr><h4 class="hscicText displayInline autoWidth floatLeft">(c) HSCIC 2015</h4><h4 class="hscicText displayInline autoWidth floatRight">Rendered at 1970-04-25T08:29:03</h4></body></html>');
				done();
			});
		});
		
		context('renderIndexPage', function() {
			it('should return the header and main body html with the test date and basic info', function(done) {
				commonTools.silentSetDebugLevel('debug');
				var result = commonTools.renderIndexPage();
				test.should(result).be.type('string');
				test.should(result).be.html;
				test.should(result).containEql('<html><head><title>');
				test.should(result).containEql('</title><style>');
				test.should(result).containEql('</style></head><body class=\"hscicText\"><p><h1 class=\"hscicHeader\">Citizen Identity Project');
				test.should(result).containEql('</h1></p><p><h3 class=\"hscicText\">Description:');
				test.should(result).containEql('<h3 class="hscicText">Service Info</h3><table class="hscicTable"><thead><tr class="hscicHeader"><th>Key</th><th>Value</th></tr></thead><tbody><tr class="hscicText"><td class="leftAlign" style="min-width: 60px;">Version</td><td class="leftAlign">'+packageJson.version+'</td></tr><tr class="hscicText"><td class="leftAlign" style="min-width: 60px;">Author</td><td class="leftAlign">HSCIC</td></tr><tr class="hscicText"><td class="leftAlign" style="min-width: 60px;">Uptime</td><td class="leftAlign">00 days and 00:00:00 since 1970-04-25T08:29:03</td></tr><tr class="hscicText"><td class="leftAlign" style="min-width: 60px;">Debug level</td><td class="leftAlign">debug</td></tr></tbody></table>');
				test.should(result).containEql('<h3 class="hscicText">Service System Events</h3><table class="hscicTable"><thead><tr class="hscicHeader"><th>Name</th><th>Value</th></tr></thead><tbody>');
				test.should(result).containEql('</tbody></table></td></tr></tbody></table></p>');
				done();
			});
		});
	});

	describe('capitalizeAllWords', function() {

		it('should return a string with the first letter, and each subsequent letter following a whitespace, as upprcase', function(done) {
			var result = commonTools.capitalizeAllWords('this should-look like it is_first_letter caps');
			test.should(result).be.type('string');
			test.should(result).be.text;
			test.should(result).be.equal('This Should-Look Like It Is_first_letter Caps');
			done();
		});
	});

	describe('renderKeyValueTable', function() {
		context('should render a table with the title header, column headings, and key-value tuples', function() {

			it('with a row per tuple from the data we set', function(done) {
				var result = commonTools.renderKeyValueTable("This Be The Verse by P.Larkin", "Lines", "Quotes", { "Line 9" : "Man hands on misery to man." , "Line 12" : "And dont have any kids yourself."});
				test.should(result).be.type('string');
				test.should(result).be.html;
				test.should(result).containEql('<h3 class=\"hscicText\">This Be The Verse by P.Larkin</h3>');
				test.should(result).containEql('<table class=\"hscicTable\">');
				test.should(result).containEql('<thead><tr class=\"hscicHeader\"><th>Lines</th><th>Quotes</th></tr></thead>');
				test.should(result).containEql('<tbody>');
				test.should(result).containEql('<tr class="hscicText"><td class="leftAlign" style="min-width: 60px;">Line 9</td><td class="leftAlign">Man hands on misery to man.</td></tr>');
				test.should(result).containEql('<tr class="hscicText"><td class="leftAlign" style="min-width: 60px;">Line 12</td><td class="leftAlign">And dont have any kids yourself.</td></tr>');
				test.should(result).containEql('</tbody>');
				test.should(result).containEql('</table>');
				test.should(result).be.equal('<h3 class=\"hscicText\">This Be The Verse by P.Larkin</h3><table class=\"hscicTable\"><thead><tr class=\"hscicHeader\"><th>Lines</th><th>Quotes</th></tr></thead><tbody><tr class=\"hscicText\"><td class=\"leftAlign\" style=\"min-width: 60px;\">Line 9</td><td class=\"leftAlign\">Man hands on misery to man.</td></tr><tr class=\"hscicText\"><td class=\"leftAlign\" style=\"min-width: 60px;\">Line 12</td><td class=\"leftAlign\">And dont have any kids yourself.</td></tr></tbody></table>');
				done();
			});
			
			it('with the errorDisplay class on error, null, undefined and NaN cells', function(done) {
				var result = commonTools.renderKeyValueTable("Title", "Keys", "Values", { 
					"test1" : "text with ErrOR",
					"test2" : "text with NuLL",
					"test3" : "text with nAn",
					"test4" : "text with undEFined",
					});
				test.should(result).be.type('string');
				test.should(result).be.html;
				test.should(result).containEql('<h3 class=\"hscicText\">Title</h3>');
				test.should(result).containEql('<table class=\"hscicTable\">');
				test.should(result).containEql('<thead><tr class=\"hscicHeader\"><th>Keys</th><th>Values</th></tr></thead>');
				test.should(result).containEql('<tbody>');
				test.should(result).containEql('<tr class="hscicText"><td class="leftAlign" style="min-width: 60px;">test1</td><td class="leftAlign errorDisplay">text with ErrOR</td></tr>');
				test.should(result).containEql('<tr class="hscicText"><td class="leftAlign" style="min-width: 60px;">test2</td><td class="leftAlign errorDisplay">text with NuLL</td></tr>');
				test.should(result).containEql('<tr class="hscicText"><td class="leftAlign" style="min-width: 60px;">test3</td><td class="leftAlign errorDisplay">text with nAn</td></tr>');
				test.should(result).containEql('<tr class="hscicText"><td class="leftAlign" style="min-width: 60px;">test4</td><td class="leftAlign errorDisplay">text with undEFined</td></tr>');
				test.should(result).containEql('</tbody>');
				test.should(result).containEql('</table>');
				done();
			});
			
			it('with the warningDisplay class on warning cells', function(done) {
				var result = commonTools.renderKeyValueTable("Title", "Keys", "Values", { "test-data" : "text with WarnING"});
				test.should(result).be.type('string');
				test.should(result).be.html;
				test.should(result).containEql('<h3 class=\"hscicText\">Title</h3>');
				test.should(result).containEql('<table class=\"hscicTable\">');
				test.should(result).containEql('<thead><tr class=\"hscicHeader\"><th>Keys</th><th>Values</th></tr></thead>');
				test.should(result).containEql('<tbody>');
				test.should(result).containEql('<tr class="hscicText"><td class="leftAlign" style="min-width: 60px;">test-data</td><td class="leftAlign warningDisplay">text with WarnING</td></tr>');
				test.should(result).containEql('</tbody>');
				test.should(result).containEql('</table>');
				done();
			});
			
			it('with the okDisplay class on cells starting with ok', function(done) {
				var result = commonTools.renderKeyValueTable("Title", "Keys", "Values", { 
					"test-data1" : "oK at start should be picked up",
					"test-data2" : "This has hOKey-cOKey somewhere else and should not"
					});
				test.should(result).be.type('string');
				test.should(result).be.html;
				test.should(result).containEql('<h3 class=\"hscicText\">Title</h3>');
				test.should(result).containEql('<table class=\"hscicTable\">');
				test.should(result).containEql('<thead><tr class=\"hscicHeader\"><th>Keys</th><th>Values</th></tr></thead>');
				test.should(result).containEql('<tbody>');
				test.should(result).containEql('<tr class="hscicText"><td class="leftAlign" style="min-width: 60px;">test-data1</td><td class="leftAlign okDisplay">oK at start should be picked up</td></tr>');
				test.should(result).containEql('<tr class="hscicText"><td class="leftAlign" style="min-width: 60px;">test-data2</td><td class="leftAlign">This has hOKey-cOKey somewhere else and should not</td></tr>');
				test.should(result).containEql('</tbody>');
				test.should(result).containEql('</table>');
				done();
			});
			
			it('with the notSetDisplay class on n/a and unknown cells or exactly zero', function(done) {
				var result = commonTools.renderKeyValueTable("Title", "Keys", "Values", { 
					"test1" : "text with N/A",
					"test2" : "text with unKNown",
					"test3" : "text with 0 should not be set",
					"test4" : " 0 " //should get trimmed for comparison
					});
				test.should(result).be.type('string');
				test.should(result).be.html;
				test.should(result).containEql('<h3 class=\"hscicText\">Title</h3>');
				test.should(result).containEql('<table class=\"hscicTable\">');
				test.should(result).containEql('<thead><tr class=\"hscicHeader\"><th>Keys</th><th>Values</th></tr></thead>');
				test.should(result).containEql('<tbody>');
				test.should(result).containEql('<tr class="hscicText"><td class="leftAlign" style="min-width: 60px;">test1</td><td class="leftAlign notSetDisplay">text with N/A</td></tr>');
				test.should(result).containEql('<tr class="hscicText"><td class="leftAlign" style="min-width: 60px;">test2</td><td class="leftAlign notSetDisplay">text with unKNown</td></tr>');
				test.should(result).containEql('<tr class="hscicText"><td class="leftAlign" style="min-width: 60px;">test3</td><td class="leftAlign">text with 0 should not be set</td></tr>');
				test.should(result).containEql('<tr class="hscicText"><td class="leftAlign" style="min-width: 60px;">test4</td><td class="leftAlign notSetDisplay"> 0 </td></tr>');
				test.should(result).containEql('</tbody>');
				test.should(result).containEql('</table>');
				done();
			});
		});
	});

	describe('systemEvent handler functions', function() {

		beforeEach(function(done) {
			commonTools.clearSystemEvents();
			test.should(commonTools.currentSystemEvents()).be.an.Object.and.be.eql({});
			done();
		});
			
		context('systemEventDefaults', function() {
			
			it('should start off empty', function(done) {		
				test.should(commonTools.currentSystemEvents()).be.an.Object.and.be.eql({});
				done();
			});
			
			it('should set the default values based on keys when called', function(done) {				
				commonTools.systemEventDefaults({ 'Alice' : 'in wonderland', 'Bob' : 'with silent J on an adventure' });
				
				test.should(commonTools.currentSystemEvents()).be.an.Object.and.be.eql({ 'Alice' : 'in wonderland', 'Bob' : 'with silent J on an adventure' });
				done();
			});
			
			it('should update existing keys and add new ones when repeatedly called', function(done) {				
				commonTools.systemEventDefaults({ 'Alice' : 'in wonderland', 'Bob' : 'with silent J on an adventure' });
				commonTools.systemEventDefaults({ 'Bob' :'second adventure with silent J', 'Charlie' : 'in the chocolate factory' });
				
				test.should(commonTools.currentSystemEvents()).be.an.Object.and.be.eql({ 'Alice' : 'in wonderland', 'Bob' :'second adventure with silent J', 'Charlie' : 'in the chocolate factory' });
				done();
			});
		});
		
		context('systemEventData', function() {
			it('should update an existing item value based on key', function(done) {
				commonTools.systemEventDefaults({ 'Alice' : 'in wonderland', 'Bob' : 'with silent J on an adventure' });
				commonTools.systemEventData('Alice', 'talking to the Caterpillar');
				
				test.should(commonTools.currentSystemEvents()).be.an.Object.and.be.eql({ 'Alice' : 'talking to the Caterpillar', 'Bob' : 'with silent J on an adventure' });
				done();
			});
		});
		
		context('systemEvent', function() {
			it('should update an existing item value to the current date based on key', function(done) {
				commonTools.systemEventDefaults({ 'Alice' : 'in wonderland', 'Bob' : 'with silent J on an adventure' });
				commonTools.systemEvent('Alice');
			
				test.should(commonTools.currentSystemEvents()).be.an.Object.and.be.eql({ 'Alice' : '1970-04-25T08:29:03', 'Bob' : 'with silent J on an adventure' });
				done();
			});
        
		});
		
		context('systemEventPlusOne', function() {
			it('should update an existing event counter to the next integer value based on key', function(done) {
				commonTools.systemEventDefaults({ 'Alice' : 'in wonderland', 'Caterpillar Leg Count' : '10' });
				commonTools.systemEventPlusOne('Caterpillar Leg Count');
				commonTools.systemEventPlusOne('Caterpillar Leg Count');
				
				test.should(commonTools.currentSystemEvents()).be.an.Object.and.be.eql({ 'Alice' : 'in wonderland', 'Caterpillar Leg Count' : 12 });
				done();
			});
		});
		
		context('renderSystemEvents', function() {
		
			beforeEach(function(done) {
				commonTools.clearSystemEvents();
				done();
			});
		
			it('should render the system events with a header and data table even with no data set', function(done) {
				var result = commonTools.renderSystemEvents();
				test.should(result).be.type('string');
				test.should(result).be.html;
				test.should(result).containEql('<h3 class=\"hscicText\">Service System Events</h3>');
				test.should(result).containEql('<table class=\"hscicTable\">');
				test.should(result).containEql('<thead><tr class=\"hscicHeader\"><th>Name</th><th>Value</th></tr></thead>');
				test.should(result).containEql('<tbody></tbody>');
				test.should(result).containEql('</table>');
				test.should(result).be.equal('<h3 class=\"hscicText\">Service System Events</h3><table class=\"hscicTable\"><thead><tr class=\"hscicHeader\"><th>Name</th><th>Value</th></tr></thead><tbody></tbody></table>');
				done();
			});
        
			it('should render the system events with a header and data table with a row per tuple from any data already set', function(done) {
				commonTools.systemEventDefaults({ 'Alice' : 'in wonderland', 'Bob' : 'with silent J on an adventure' });
				var result = commonTools.renderSystemEvents();
				test.should(result).be.type('string');
				test.should(result).be.html;
				test.should(result).containEql('<h3 class=\"hscicText\">Service System Events</h3>');
				test.should(result).containEql('<table class=\"hscicTable\">');
				test.should(result).containEql('<thead><tr class=\"hscicHeader\"><th>Name</th><th>Value</th></tr></thead>');
				test.should(result).containEql('<tbody>');
				test.should(result).containEql('<tr class="hscicText"><td class="leftAlign" style="min-width: 60px;">Alice</td><td class="leftAlign">in wonderland</td></tr>');
				test.should(result).containEql('<tr class="hscicText"><td class="leftAlign" style="min-width: 60px;">Bob</td><td class="leftAlign">with silent J on an adventure</td></tr>');
				test.should(result).containEql('</tbody>');
				test.should(result).containEql('</table>');
				test.should(result).be.equal('<h3 class="hscicText">Service System Events</h3><table class="hscicTable"><thead><tr class="hscicHeader"><th>Name</th><th>Value</th></tr></thead><tbody><tr class="hscicText"><td class="leftAlign" style="min-width: 60px;">Alice</td><td class="leftAlign">in wonderland</td></tr><tr class="hscicText"><td class="leftAlign" style="min-width: 60px;">Bob</td><td class="leftAlign">with silent J on an adventure</td></tr></tbody></table>');
				done();
			});
        
			it('should respect repeat calls to systemEventDefaults', function(done) {
				commonTools.systemEventDefaults({ 'Alice' : 'in wonderland', 'Bob' : 'with silent J on an adventure' });
				commonTools.systemEventDefaults({ 'Bob' :'second adventure with silent J', 'Charlie' : 'in the chocolate factory' });
				var result = commonTools.renderSystemEvents();
				test.should(result).be.type('string');
				test.should(result).be.html;
				test.should(result).containEql('<tr class="hscicText"><td class="leftAlign" style="min-width: 60px;">Alice</td><td class="leftAlign">in wonderland</td></tr>');
				test.should(result).containEql('<tr class="hscicText"><td class="leftAlign" style="min-width: 60px;">Bob</td><td class="leftAlign">second adventure with silent J</td></tr>');
				test.should(result).containEql('<tr class="hscicText"><td class="leftAlign" style="min-width: 60px;">Charlie</td><td class="leftAlign">in the chocolate factory</td></tr>');
				test.should(result).be.equal('<h3 class="hscicText">Service System Events</h3><table class="hscicTable"><thead><tr class="hscicHeader"><th>Name</th><th>Value</th></tr></thead><tbody><tr class="hscicText"><td class="leftAlign" style="min-width: 60px;">Alice</td><td class="leftAlign">in wonderland</td></tr><tr class="hscicText"><td class="leftAlign" style="min-width: 60px;">Bob</td><td class="leftAlign">second adventure with silent J</td></tr><tr class="hscicText"><td class="leftAlign" style="min-width: 60px;">Charlie</td><td class="leftAlign">in the chocolate factory</td></tr></tbody></table>');
				done();
			});
		});
	});

	describe('generateGuid', function() {

		it('should return a guid string formatted with lowercase alpha-numerics and dashes', function(done) {
			var result = commonTools.generateGuid();
			test.should(result).be.type('string');
			test.should(result).be.text;
			test.should(result).match(/[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}/);
			done();
		});
	});

	describe('generateRandomDigits', function() {

		it('should return a string of 4 digits', function(done) {
			var result = commonTools.generateRandomDigits();
			test.should(result).be.type('string');
			test.should(result).be.text;
			test.should(result).match(/[0-9]{4}/);
			done();
		});
	});

	describe('removeLineBreaksAndDoubleSpaces', function() {

		it('should return a flattended string', function(done) {
			var multiLineText = "Hey man,  this is on  a line\n" +
					"   and this is    on another\n" +
					"and  this is    on a third!";
			var result = commonTools.removeLineBreaksAndDoubleSpaces(multiLineText);
			test.should(result).be.type('string');
			test.should(result).be.text;
			test.should(result).be.equal('Hey man, this is on a line and this is on another and this is on a third!');
			done();
		});
	});

	describe('removeMatchingItems', function() {
		//removeMatchingItems(targetList, propertyName, targetValue)

		function sourceDataStrings() {
			return [
				{ 'key-1' : 'value-a' },
				{ 'key-1' : 'value-b' },
				{ 'key-1' : 'value-c' },
				{ 'key-1' : 'value-b' },
				{ 'key-1' : 'value-c' },
				{ 'key-1' : 'value-c' },
				{ 'key-2' : 'value-a' },
				{ 'key-2' : 'value-b' },
				{ 'key-2' : 'value-c' }
			];
		}

		function sourceDataBooleans() {
			return [
				{ 'key-1' : true },
				{ 'key-1' : false },
				{ 'key-2' : true },
				{ 'key-2' : false }
			];
		}

		it('should return the original list mutated with the matching items popped out when matching on strings', function(done) {
			var result = sourceDataStrings();
			commonTools.removeMatchingItems(result, 'key-1', 'value-b');
			test.should(result).be.instanceof(Array).and.have.lengthOf(7);
			test.array(result).is([
				{ 'key-1' : 'value-a' },
				{ 'key-1' : 'value-c' },
				{ 'key-1' : 'value-c' },
				{ 'key-1' : 'value-c' },
				{ 'key-2' : 'value-a' },
				{ 'key-2' : 'value-b' },
				{ 'key-2' : 'value-c' }
			]);
			done();
		});

		it('should return the original list mutated with the matching items popped out for any value', function(done) {
			var result = sourceDataStrings();
			commonTools.removeMatchingItems(result, 'key-1', 'value-c');
			test.should(result).be.instanceof(Array).and.have.lengthOf(6);
			test.array(result).is([
				{ 'key-1' : 'value-a' },
				{ 'key-1' : 'value-b' },
				{ 'key-1' : 'value-b' },
				{ 'key-2' : 'value-a' },
				{ 'key-2' : 'value-b' },
				{ 'key-2' : 'value-c' }
			]);
			done();
		});

		it('should work when operating on booleans for true', function(done) {
			var result = sourceDataBooleans();
			commonTools.removeMatchingItems(result, 'key-1', true);
			test.should(result).be.instanceof(Array).and.have.lengthOf(3);
			test.array(result).is([
				{ 'key-1' : false },
				{ 'key-2' : true },
				{ 'key-2' : false }
			]);
			done();
		});

		it('should work when operating on booleans for false', function(done) {
			var result = sourceDataBooleans();
			commonTools.removeMatchingItems(result, 'key-2', false);
			test.should(result).be.instanceof(Array).and.have.lengthOf(3);
			test.array(result).is([
				{ 'key-1' : true },
				{ 'key-1' : false },
				{ 'key-2' : true }
			]);
			done();
		});
	});
});