/*
 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
 */

YUI.add('parseModel-tests', function(Y) {
    
    var suite = new YUITest.TestSuite('parseModel-tests'),
        model = null,
        A = YUITest.Assert;
    
    suite.add(new YUITest.TestCase({
        
        name: 'parse model user tests',
        
        setUp: function() {
            model = Y.mojito.models.parseModelFoo;
        },
        tearDown: function() {
            model = null;
        },
        
        'test mojit model': function() {
            A.isNotNull(model);
            A.isFunction(model.getData);
        }
        
    }));
    
    YUITest.TestRunner.add(suite);
    
}, '0.0.1', {requires: ['mojito-test', 'parseModelFoo']});
