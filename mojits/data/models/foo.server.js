/*
 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
 */
YUI.add('dataModelFoo', function(Y) {

/**
 * The dataModelFoo module.
 *
 * @module data
 */

    /**
     * Constructor for the dataModelFoo class.
     *
     * @class dataModelFoo
     * @constructor
     */
    Y.mojito.models.dataModelFoo = {

        init: function(config) {
            this.config = config;
        },

        /**
         * Method that will be invoked by the mojit controller to obtain data.
         *
         * @param callback {Function} The callback function to call when the
         *        data has been retrieved.
         */
        getData: function(callback) {
            callback({some:'data'});
        }

    };

}, '0.0.1', {requires: []});
