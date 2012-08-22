/*
 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
 */

YUI.add('templateModel-tests', function(Y) {
    
    var suite = new YUITest.TestSuite('templateModel-tests'),
        model = null,
        A = YUITest.Assert;
    
    suite.add(new YUITest.TestCase({
        
        name: 'template model user tests',
        
        setUp: function() {
            model = Y.mojito.models.templateModelFoo;
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
    
}, '0.0.1', {requires: ['mojito-test', 'templateModelFoo']});
