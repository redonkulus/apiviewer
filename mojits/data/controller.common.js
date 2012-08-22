/*
 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
 */
YUI.add('data', function(Y) {

/**
 * The data module.
 *
 * @module data
 */

    /**
     * Constructor for the Controller class.
     *
     * @class Controller
     * @constructor
     */
    Y.mojito.controller = {

        /**
         * Method corresponding to the 'index' action.
         *
         * @param ac {Object} The ActionContext that provides access
         *        to the Mojito API.
         */
        index: function(ac) {
            var xmltojson = require('xmltojson.js');
            Y.log(xmltojson);
            
            ac.done();
        }

    };

}, '0.0.1', {requires: ['mojito']});
