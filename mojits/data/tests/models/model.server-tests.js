/*
 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
 */

YUI.add('dataModel-tests', function(Y) {
    
    var suite = new YUITest.TestSuite('dataModel-tests'),
        model = null,
        A = YUITest.Assert;
    
    suite.add(new YUITest.TestCase({
        
        name: 'data model user tests',
        
        setUp: function() {
            model = Y.mojito.models.dataModelFoo;
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
    
}, '0.0.1', {requires: ['mojito-test', 'dataModelFoo']});
