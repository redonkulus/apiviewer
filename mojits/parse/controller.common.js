/*
 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
 */
YUI.add('parse', function(Y) {

/**
 * The parse module.
 *
 * @module parse
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
            var url = ac.params.getFromUrl('uri');
            if (url === '') _handleError(ac, 'URI was empty.');
            
            // perform io request from url passed in
            Y.on('io:success', _ioSuccess, Y, [ac]);
            Y.on('io:failure', _ioFailure, Y, [ac]);
            var request = Y.io(url);
            
            // todo: save succesful to history
        }

    };
    
    /**
     * Handle success responses
     *
     * @param tid {integer} Transaction identifier
     * @param resp {object} Response object
     * @param tid {array} List of arguments passed from event
     */
    function _ioSuccess(tid, resp, args) {
        var ac = args[0];
        ac.done({"data" : resp.responseText})
    }
    
    /**
     * Handle success responses
     *
     * @param tid {integer} Transaction identifier
     * @param resp {object} Response object
     * @param tid {array} List of arguments passed from event
     */
    function _ioFailure(tid, resp, args) {
        var ac = args[0];
        _handleError(ac, 'Failed to return data from request.');
    }
    
    /**
     * Utility function to handle errors
     *
     * @param ac {Object} The ActionContext that provides access
     *        to the Mojito API.
     */
    function _handleError(ac, msg) {
        var error = new Error();
        error.code = '404';
        error.message = msg;
        ac.error(error);
    }

}, '0.0.1', {requires: ['mojito','io-base']});
