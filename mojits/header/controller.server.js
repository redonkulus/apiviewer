/*
 * Copyright (c) 2012 Yahoo! Inc. All rights reserved.
 */
YUI.add('apiviewer-header', function(Y) {

/**
 * The test module.
 *
 * @module test
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
            ac.done();
        }

    };

}, '0.0.1', {requires: ['mojito']});
