/*
 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
 */
YUI.add('apiviewer-config', function(Y) {

/**
 * The template module.
 *
 * @module template
 */

    /**
     * Constructor for the Controller class.
     *
     * @class Controller
     * @constructor
     */
    Y.mojito.controller = {
        /*
        init: function() {
            this.config = config;
        },
        */

        /**
         * Method corresponding to the 'index' action.
         *
         * @param ac {Object} The ActionContext that provides access
         *        to the Mojito API.
         */
        index: function(ac) {
            var properties = ac.config.get('properties');
            ac.done({properties: properties});
        }

    };

}, '0.0.1', {requires: ['mojito']});
