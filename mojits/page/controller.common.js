/*
 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
 */
YUI.add('apiviewer-page', function(Y) {

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
    
        init: function(config) {
            this.config = config;
        },

        /**
         * Method corresponding to the 'index' action.
         *
         * @param ac {Object} The ActionContext that provides access
         *        to the Mojito API.
         */
        index: function(ac) {
            var cfg = {
                "children" : {
                    "header" : {
                        "type" : "header"
                    },
                    "message" : {
                        "type" : "message"
                    },
                    "config" : {
                        "type" : "config"
                    },
                    "viewer" : {
                        "type" : "viewer"
                    },
                    "history" : {
                        "type" : "history"
                    }
                }
            }
            ac.composite.execute(cfg, function(data, meta) {
                ac.done(data, meta);
            });
        }

    };

}, '0.0.1', {requires: ['mojito']});
