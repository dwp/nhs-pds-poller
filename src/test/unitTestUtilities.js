//Unit Test helper methods

module.exports = {
	
	extendMockRequestWithExpressHelperMethods: function (targetMockRequest){
		targetMockRequest.encodingCharsCalled = false;
		targetMockRequest.encodingCharsValue = 'not-set';	
		targetMockRequest.setEncoding = function(newValue){
			this.encodingCharsCalled = true;
			this.encodingCharsValue = newValue;
		};

		targetMockRequest.onTypes = {};
		targetMockRequest.onCalled = false;
		targetMockRequest.on = function(type, targetFunction){
			this.onTypes[type] = targetFunction;
			this.onCalled = true;
		};
		
		targetMockRequest.eventCalled = false;
		targetMockRequest.event = function(type){
			this.onTypes[type]();
			this.eventCalled = true;
		};

		targetMockRequest.nextCalled = false;
		targetMockRequest.mockNextFunction = function(){
			targetMockRequest.nextCalled = true;
		}
	},

	testDate: function (){
		return new Date(9876543210);
	}

}