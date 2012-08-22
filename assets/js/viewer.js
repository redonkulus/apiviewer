(function() {  
    YAHOO.namespace('APIViewer');

    var util = YAHOO.util,
        Lang = YAHOO.lang,
        Dom = util.Dom,
        Event = util.Event,
        CustomEvent = util.CustomEvent,
        Connect = util.Connect,
        JSON = Lang.JSON,
        Selector = util.Selector;
        APIViewer = YAHOO.APIViewer;

    /**
     * The APIViewer module provides a user interface to view APIs.
     * @module apiviewer 
     * @namespace YAHOO.APIViewer
     * @doc http://twiki.corp.yahoo.com/view/Media/APIViewer
     * @requires yahoo, dom, event, customevent, connect, json 
     */
    YAHOO.APIViewer = 
    {
        /**
         * Alias for the given configurations
         * @property this.alias
         * @type String
         */
        alias : null,
        
        /**
         * Parameters to generate the alias for bookmarking
         * @property this.aliasParams
         * @type String
         */
        aliasParams : null,
        
        /**
         * Debug mode is only true when custom config is 
         * passed in via query param. When true, permalink alias and 
         * "recent queries" are not created
         * @property this.debug
         */
        debug : false,
        
        /**
         * Current property selected in the viewer
         * NOTE: this could be a path to config URL for testing purposes
         * @property this.property
         * @type String
         */
        property : null,
    
        /**
         * Stores all the HTML elements referenced in the page
         * @property this.el
         * @type Object
         */
        el : 
        {
            apis : Dom.get('api-apis'),
            body : document.body,
            config : Dom.get('api-config'),
            buttons : Dom.get('api-buttons'),
            history : Dom.get('api-history'),
            message : Dom.get('api-message'),
            form : document.cfg,
            headers : Dom.get('api-headers'),
            help : Dom.get('api-message'),//Dom.get('api-help'),
            params : Dom.get('api-params'),
            query : Dom.get('api-query'),
            path : Dom.get('api-path'),
            properties : Dom.get('api-properties'),
            req_headers : Dom.get('api-req-headers'),
            resp_headers : Dom.get('api-resp-headers'),
            servers : Dom.get('api-servers'),
            viewer : Dom.get('api-viewer')
        },
        
        /**
         * Stores language definitions
         * @property this.defs
         * @type Object
         */
        defs : 
        {
            COLLAPSE : "Collapse",
            ERROR_ALIAS : "Sorry, we could not retrieve information for the supplied alias.",
            ERROR_API_LOAD : "Oops...API could not be loaded. Please make sure URI is correct:",
            ERROR_API_PARAMS : "Oops ... API params were not returned. Please try again.",
            ERROR_NO_SERVERS : "Oops ... no servers were found for that property.",
            ERROR_NO_APIS : "Oops ... no APIs were found for that property.",
            ERROR_PARAM_PREV : "Parameter preview failed. Please try again.",
            ERROR_INVALID_API : "Please use a valid API URI to display.",
            EXPAND : "Expand",
            HEADERS : "All Request Headers",
            LINK : "Link",
            LOADING_DATA : "Loading data ...",
            LOADING_API : "Loading API ...",
            LOADING_PARAMS : "Loading parameters ...",
            MESSAGE_SELECT_PROPERTY : "Please select a property to continue.",
            MESSAGE_SELECT_SERVER : "Please select a server to continue.",
            MESSAGE_SELECT_HOST : "Please select a host and API to continue.",
            MESSAGE_SELECT_API : "Please select an API to view.",
            MESSAGE_API_PARAMS : "Fill in the API parameters to complete your request.",
            PERMALINK_DESC : "Paste link in Email or IM",
            REQUEST_HEADERS : "Request Headers",
            RESPONSE_HEADERS : "Response Headers",
            SERVER : "Server:",
            VIEW : "Open",
            VIEWER_TITLE : "API Results"
        },
        
        /**
         * HTML to display loading image
         * @property this.loadingImgHTML
         * @type String
         */
        loadingImgHTML : '<img src="http://l.yimg.com/a/i/ww/met/anim_loading_sm_082208.gif" class="mod loading">',
        
        /**
         * Contains URI parts from hash value
         * @property this.uri
         * @type Object
         */
        uri : {},
        
        /**
         * Stores all custom event objects
         * @property this.events
         * @type Object
         */
        events : {
            'onRenderServersSuccess' : new CustomEvent('onRenderServersSuccess', this, null, null, false),
            'onRenderAPIsSuccess' : new CustomEvent('onRenderAPIsSuccess', this, null, null, false),
            'onRenderParamsSuccess' : new CustomEvent('onRenderParamsSuccess', this, null, null, false),
            'onGetAliasSuccess' : new CustomEvent('onGetAliasSuccess', this, null, null, false),
        },

        /**
         * Initializes the viewer
         * @method init
         * @return null
         */
        init : function()
        {
            // reset property field
            this.el.form.properties.selectedIndex = 0;
        
            this.addListeners();
            
            this.initBookmark();
            
            this.initCustomConfig();
        },
        
        /**
         * If hash exists, display API and set configs, e.g. #1FuVwc
         * use try catch because ie6 cannot handle special characters in hash
         * @method initBookmark
         * @return null
         */
        initBookmark : function()
        {
            try
            {
                if (document.location.hash && document.location.hash != '#')
                {
                    // strip '#' off the beginning alias
                    var alias = document.location.hash.substr(1);
                    
                    this.parseAlias(alias);
                }
            } catch(e) {}
        },
        
        /**
         * For testing purposes, users can pass in a custom config to test via 'config' query parameter
         * @method initCustomConfig
         * @example ?config=http://path/to/config.xml
         * @return null
         */
        initCustomConfig : function()
        {
            if (window.location.search)
            {
                var params = window.location.search.substring(1).split('&');
                for (var x in params)
                {
                    var split = params[x].split('=');
                    switch (split[0])
                    {
                        case 'config' :
                            this.property = split[1];
                            this.getPropertyConfigs(split[1]);
                            this.debug = true;
                            break;
                        case 'debug' : 
                            this.debug = split[1] === 'true' ? true : false;
                            break;
                    }
                }
            }
        },
        
        /**
         * Add event listeners to the viewer
         * @method addListeners
         * @return null
         */
        addListeners : function()
        {
            Event.on(this.el.form, 'submit', this.setAPIURI, this.el.form, this);
            Event.on(document.body, 'click', this.handleEvents, null, this);
            
            // attach change event to property dropdown menu
            Event.on(
                this.el.form.properties,
                'change',
                function(e, el)
                {
                    // reset the URI property
                    this.uri = {};
                    
                    // reset viewer
                    this.clearAPIParams();
                    
                    this.property = el[el.selectedIndex].value;
                    
                    // retrieve list of servers and APIs for property
                    this.getPropertyConfigs(this.property);
                },
                this.el.form.properties, this
            );
                        
            // add uri to history
            this.events.onGetAliasSuccess.subscribe(
                function(e, args, that)
                {
                    that.alias = args[0];
                    that.addURIToHistory(args[1], args[0]);
                }, this
            );
        },
        
        /**
         * Handle config container clicks
         * @method handleEvents
         * @return null
         */
        handleEvents : function(e, el)
        {
            var target = Event.getTarget(e),
                nodeName = target.nodeName.toLowerCase();
            
            while (target)
            {
                if (target && target.nodeName.toLowerCase() == 'body') break;
                
                // user clicked on API name
                if (nodeName == 'label' && Dom.getAncestorByClassName(target, 'api-apis'))
                {
                    // reset viewer
                    this.clearAPIParams();
                    
                    // remove custom events so API isnt rendered right away
                    this.clearCustomEvents();
                    
                    // set selected API
                    this.selectAPI(target);
                    
                    // get API specs
                    this.getAPIPathAndQuery(target.id);
                    
                    Event.preventDefault(e);
                    
                    break;
                }
                
                // user clicked on example uri from history
                if (nodeName == 'a' && Dom.getAncestorByClassName(target, 'api-history'))
                {
                    if (target.href && target.href != '')
                    {
                        // setup property configs
                        this.parseAlias(target.getAttribute('rel'));
                        
                        Event.preventDefault(e);
                        
                        break;
                    }
                }
                
                // request headers clicked
                if (nodeName == 'a' && Dom.hasClass(target, 'req-header'))
                {
                    this.el.req_headers = Dom.get('api-req-headers');
                    
                    if (Dom.hasClass(this.el.req_headers, 'hide'))
                    {
                        Dom.removeClass(this.el.req_headers, 'hide');
                    }
                    else
                    {
                        Dom.addClass(this.el.req_headers, 'hide');
                    }
                
                    Event.preventDefault(e);
                    
                    break;
                }
                
                // response headers clicked
                if (nodeName == 'a' && Dom.hasClass(target, 'resp-header'))
                {
                    this.el.resp_headers = Dom.get('api-resp-headers');
                    
                    if (Dom.hasClass(this.el.resp_headers, 'hide'))
                    {
                        Dom.removeClass(this.el.resp_headers, 'hide');
                    }
                    else
                    {
                        Dom.addClass(this.el.resp_headers, 'hide');
                    }
                
                    Event.preventDefault(e);
                    
                    break;
                }
                
                // permalink clicked
                if (nodeName == 'a' && Dom.hasClass(target, 'ilink'))
                {
                    if (this.alias)
                    {
                        var parentNode = target.parentNode,
                            html = [
                            '<div class="permalink">',
                                '<label>' + this.defs.PERMALINK_DESC + '</label>',
                                '<input type="text" value="http://' + document.location.host + '/' + (document.location.search ? document.location.search : '') + '#' + this.alias + '" onfocus="this.select()" />',
                                '<img src="http://l.yimg.com/us.yimg.com/i/nt/ic/ut/bsc/closesm12_1.gif" alt="Close Permalink" class="close" onclick="this.parentNode.parentNode.removeChild(this.parentNode);" />',
                            '</div>'
                        ];
                        
                        parentNode.innerHTML = parentNode.innerHTML + html.join('\n');
                    }
                
                    Event.preventDefault(e);
                    
                    break;
                }
                
                // expand/collapse clicked
                if (nodeName == 'a' && Dom.hasClass(target, 'iresize'))
                {
                    if (Dom.hasClass(this.el.body, 'expand'))
                    {
                        Dom.replaceClass(this.el.body, 'expand', 'collapse');
                        target.innerHTML = this.defs.EXPAND;
                    }
                    else
                    {
                        Dom.replaceClass(this.el.body, 'collapse', 'expand');
                        target.innerHTML = this.defs.COLLAPSE;
                    }
                
                    Event.preventDefault(e);
                    
                    break;
                }
                
                // nothing found, get parent node
                target = target.parentNode;
            }
        },
        
        /**
         * Save the selected API
         * @method selectAPI
         * @param {Object} el The selected API HTML element
         * @return null
         */
        selectAPI : function(el)
        {
            if (!el) return false;
            
            var listItem = el.parentNode;
            
            // clear previous selected API
            this.deselectAPI();
            
            // set parent node class to active
            Dom.addClass(listItem, 'active');
            
            // get offsetTop of listItem
            var offsetTop = listItem.offsetTop;
            if (offsetTop > 0)
            {
                // get height of listItem
                var listItemHeight = listItem.offsetHeight;
                
                // scroll list to selected listItem minus its height
                listItem.parentNode.scrollTop = (offsetTop - listItemHeight) - 5;
            }
            
            var input = listItem.getElementsByTagName('INPUT')[0];
            if (input)
            {
                // check the input box
                input.checked = true;
                
                // set selected API
                this.selectedAPI = input;
            }
        },
        
        /**
         * Clear the selected API
         * @method deselectAPI
         * @return null
         */
        deselectAPI : function()
        {
            if (this.selectedAPI)
            {
                Dom.removeClass(this.selectedAPI.parentNode, 'active');
        
                this.selectedAPI = null;
            }
        },
        
        /**
         * Get the list of APIs and servers for property
         * @method getPropertyConfigs
         * @param {String} property The name of the property
         * @return null
         */
        getPropertyConfigs : function(property)
        {
            if (property == '')
            {
                this.clearViewer();
            
                return this.renderMessage(this.defs.MESSAGE_SELECT_PROPERTY);
            }
            
            // ajax to get property apis
            var callback =
            {
                success : function(o)
                {
                    // parse JSON data
                    var json = JSON.parse(o.responseText);
                    if (json.status_code == 200)
                    {
                        // build servers
                        this.renderServers(json);
                        
                        // build APIs
                        this.renderAPIs(json);
                        
                        // reset help message
                        this.renderHelp(this.defs.MESSAGE_SELECT_HOST);
                    }
                    else
                    {
                        this.renderHelp(json.data);
                    }
                },
                failure : function(o)
                {
                    this.renderHelp(this.defs.ERROR_API_PARAMS);
                },
                scope : this
            }
            
            // fire ajax call
            var params = '?property=' + this.property + '&' + this.renderDebugParameter();
            var trans = Connect.asyncRequest('GET', '/data' + params, callback);
            
            // show loading message
            this.renderHelp(this.loadingImgHTML + this.defs.LOADING_DATA);
        },
        
        /**
         * Generates the HTML list of property servers
         * @method renderServers
         * @param {Object} obj Object literal of property data
         * @return null
         */
        renderServers : function(obj)
        {
            if (!obj.data.servers) return this.renderMessage(this.defs.ERROR_NO_SERVERS, true);
            
            // build select server options
            var servers = [], x = 1;
            for (var i in obj.data.servers)
            {
                var selected = x == 1 ? ' selected="selected"' : '' ;
                servers.push('<option value="http://' + obj.data.servers[i] + '"' + selected + '>' + i + '</option>');
                x++;
            }
            
            // complete server form html
            var html = [
                '<li>',
                    '<label class="hide">' + this.defs.SERVER + '</label>',
                    '<select name="server" size="9">',
                        servers,
                    '</select>',
                '</li>'
            ].join('\n');
            
            // get servers list node and insert HTML
            this.el.servers.getElementsByTagName('ol')[0].innerHTML = html;
            
            // remove hide class from servers fieldset
            Dom.removeClass(this.el.servers, 'hide');
                        
            // fire custom event
            this.events.onRenderServersSuccess.fire(obj);
        },
        
        /**
         * Generates the HTML list of property APIs
         * @method renderAPIs
         * @param {Object} obj Object literal of property data
         * @return null
         */
        renderAPIs : function(obj)
        {
            if (!obj.data.apis) return this.renderMessage(this.defs.ERROR_NO_APIS, true);
            
            // build select server options
            var html = [],
                count = 1,
                container = this.el.apis.getElementsByTagName('ol')[0];
                
            for (var i in obj.data.apis)
            {
                html.push('<li' + (count == 1 ? ' class="first"' : '') + '>');
                html.push('<input type="radio" name="apis" value="' + obj.data.apis[i] + '" id="api' + count + '" class="hide">');
                html.push('<label for="api' + count + '" id="' + obj.data.apis[i] + '">' + obj.data.apis[i] + '</label>');
                html.push('</li>');
                count++;
            }
          
            // get servers list node and insert HTML
            container.innerHTML = html.join('\n');
            
            // remove hide class from apis fieldset
            Dom.removeClass(this.el.apis, 'hide');
            
            // fix scroll position
            container.scrollTop = 0;
                        
            // fire custom event
            this.events.onRenderAPIsSuccess.fire(obj);
        },
        
        /**
         * Get the API specs from data file
         * @method getAPIPathAndQuery
         * @param {String} uri The uri of the API
         * @return null
         */
        getAPIPathAndQuery : function(uri)
        {
            if (!uri) return false;
            
            // ajax to get api specs
            var callback =
            {
                success : function(o)
                {
                    // parse JSON data
                    var json = JSON.parse(o.responseText);
                    if (json.status_code == 200)
                    {
                        // build paths
                        this.renderPath(json.data);
                        
                        // build parameters
                        this.renderQuery(json.data);
                        
                        // build headers
                        this.renderHeaders(json.data);
                        
                        // reset help message
                        this.renderHelp(' ');
                
                        // set instructions
                        this.renderMessage(this.defs.MESSAGE_API_PARAMS);
                
                        // fire custom event
                        this.events.onRenderParamsSuccess.fire(json.data);
                    }
                    else
                    {
                        this.renderHelp(json.data);
                    }
                },
                failure : function(o)
                {
                    this.renderHelp(this.defs.ERROR_API_PARAMS);
                },
                scope : this
            }
            
            // fire ajax call
            var params = '?uri=' + uri + '&property=' + this.property + '&' + this.renderDebugParameter();
            var trans = Connect.asyncRequest('GET', '/data' + params, callback);
                    
            // remove fluid height from apis container
            if (Dom.hasClass(this.el.apis, 'api-apis-fixed')) Dom.removeClass(this.el.apis, 'api-apis-fixed');
            
            // make viewer hidden
            Dom.addClass(this.el.viewer, 'hide');
            Dom.removeClass(this.el.history, 'hide');
            
            // show loading message
            this.renderHelp(this.loadingImgHTML + this.defs.LOADING_PARAMS);
        },
        
        /**
         * Build the API path based on the API selected
         * @method renderPath
         * @param {String} data The JSON object of API data
         * @return null
         */
        renderPath : function(api)
        {
            var html = [],
                savedPath,
                x = 0;
                
            // clear old list of path
            this.el.path.getElementsByTagName('ol')[0].innerHTML = '';
        
            // make sure methods exist for this API
            if (api.params)
            {
                // loop through each API resource path and parse out params
                for (var path in api.params)
                {
                    var pathObj = api.params[path];
                    
                    // path header
                    html.push('<li class="header">' + path.replace(savedPath, '') + '</li>');
                    
                    // Method object may contain 'matrix' parameters, need to
                    // parse the method object to include them first, as they will 
                    // apply to the general API path and not subresource
                    if (x === 0 && api.methods)
                    {
                        for (var x in api.methods)
                        {
                            if (x == 'GET')
                            {
                                var getRequest = api.methods[x];
                                for (var requestName in getRequest)
                                {
                                    // we only want matrix params
                                    if (getRequest[requestName].attr.style === 'matrix')
                                    {
                                        html.push('<li>' + this.renderParameterMarkup(getRequest[requestName]) + '</li>');
                                    }
                                }
                            }
                        }
                    } // end if methods
                    
                    // create label and input fields
                    for (var param in pathObj)
                    {
                        // we do not want to display query params here
                        if (pathObj[param].attr.style === 'matrix' || pathObj[param].attr.style === 'template')
                        {
                            html.push('<li>' + this.renderParameterMarkup(pathObj[param]) + '</li>');
                        }
                    }
                    
                    // save previous path to create path header for subresources
                    savedPath = path;
                    x++;
                }
            } // end if params
            
            // output path params
            if (html.length !== 0)
            {
                // add to params list
                this.el.path.getElementsByTagName('ol')[0].innerHTML = html.join("\n");
                
                if (this.el.path.getElementsByTagName('li').length > 0)
                {
                    // remove hide class from params fieldset
                    Dom.removeClass(this.el.path, 'hide');
                
                    // remove hide class from buttons fieldset
                    Dom.removeClass(this.el.buttons, 'hide');
                }
            }
        },
        
        /**
         * Build the query parameters based on the API selected
         * @method renderQuery
         * @param {String} data The JSON object of API data
         * @return null
         */
        renderQuery : function(api)
        {
            var queryData = [];
            
            // get query params from methods field
            if (api.methods)
            {
                for (var x in api.methods)
                {
                    if (x == 'GET')
                    {
                        var getRequest = api.methods[x];
                        for (var requestName in getRequest)
                        {
                            // we only want query params
                            if (getRequest[requestName].attr.style === 'query')
                            {
                                queryData.push(getRequest[requestName]);
                            }
                        }
                    }
                }
            }
            
            // get query params from params field (if any)
            if (api.params)
            {
                // loop through each API resource path and parse out params
                for (var path in api.params)
                {
                    var pathObj = api.params[path];
                    for (var param in pathObj)
                    {
                        // we only want query params
                        if (pathObj[param].attr.style === 'query')
                        {
                            queryData.push(pathObj[param]);
                        }
                    }
                }
            }
            
            if (queryData.length > 0)
            {
                // clear old list of query params
                this.el.query.getElementsByTagName('ol')[0].innerHTML = '';
            
                // loop through each parameter and create HTML
                var count = 0;
                for (var param in queryData)
                {
                    // create list item for each param
                    var li = document.createElement('li');
                    if (count == 0) li.className = 'first';
                    
                    // get html for param field
                    var field = this.renderParameterMarkup(queryData[param]);
                    
                    // add field html to list item
                    li.innerHTML = field;
                    
                    // add to params list
                    this.el.query.getElementsByTagName('ol')[0].appendChild(li);
                    
                    count++;
                }
                
                // remove hide class from query fieldset
                Dom.removeClass(this.el.query, 'hide');
                
                // remove hide class from params fieldset
                Dom.removeClass(this.el.params, 'hide');
                
                // remove hide class from buttons fieldset
                Dom.removeClass(this.el.buttons, 'hide');
            } // end if
        },
        
        /**
         * Check for headers in params or methods
         * @method renderHeaders
         * @param {String} data The JSON object of API data
         * @return null
         */
        renderHeaders : function(api)
        {
            var headerData = [];
            
            // get header params from methods field
            if (api.methods)
            {
                for (var x in api.methods)
                {
                    if (x == 'GET')
                    {
                        var getRequest = api.methods[x];
                        for (var requestName in getRequest)
                        {
                            // we only want query params
                            if (getRequest[requestName].attr.style === 'header')
                            {
                                headerData.push(getRequest[requestName]);
                            }
                        }
                    }
                }
            }
            
            // get query params from params field (if any)
            if (api.params)
            {
                // loop through each API resource path and parse out params
                for (var path in api.params)
                {
                    var pathObj = api.params[path];
                    for (var param in pathObj)
                    {
                        // we only want query params
                        if (pathObj[param].attr.style === 'header')
                        {
                            headerData.push(pathObj[param]);
                        }
                    }
                }
            }
            
            if (headerData.length > 0)
            {
                // clear old list of headers
                this.el.headers.getElementsByTagName('ol')[0].innerHTML = '';
            
                // loop through each parameter and create HTML
                var count = 0;
                for (var param in headerData)
                {
                    // create list item for each param
                    var li = document.createElement('li');
                    if (count == 0) li.className = 'first';
                    
                    // get html for param field
                    var field = this.renderParameterMarkup(headerData[param]);
                    
                    // add field html to list item
                    li.innerHTML = field;
                    
                    // add to params list
                    this.el.headers.getElementsByTagName('ol')[0].appendChild(li);
                    
                    count++;
                }
                
                // remove hide class from headers
                Dom.removeClass(this.el.headers, 'hide');
                
                // remove hide class from params fieldset
                Dom.removeClass(this.el.params, 'hide');
                
                // remove hide class from buttons fieldset
                Dom.removeClass(this.el.buttons, 'hide');
            } // end if
        },
        
        /**
         * Given a param object, return html input field
         * @method renderParameterMarkup
         * @param {Object} param The param object data
         * @return {String} field The input field HTML
         */
        renderParameterMarkup : function(param)
        {
            if (!param) return;
            
            // define vars
            var isRequired = !!param.attr.required || false,
                html = [],
                htmlTitle = '',
                htmlDefaultAttr = '',
                htmlRequiredAttr = (isRequired ? ' required="required"' : ''),
                htmlStyleAttr = '',
                htmlTypeAttr = '';
                name = param.attr.name,
                title = param.doc || false;
                attrDefault = param.attr['default'] || false,
                attrStyle = param.attr.style || false,
                attrType = param.attr.type || 'xsd:string',
                options = param.options || false;
                
            // style html
            if (attrStyle)
            {
                htmlStyleAttr = ' data-style="' + attrStyle + '" ';
            }
            
            // type html
            if (attrType)
            {
                htmlTypeAttr = ' data-type="' + attrType + '" ';
            }
            
            // create label
            if (title)
            {
                htmlTitle = ' title="' + title + '" '; 
            }
            html.push('<label for="' + name + '"' + htmlTitle + '>' + name);
            
            // if field is required then add '*'
            if (isRequired) html.push('*');
            
            // close label    
            html.push(':</label> ');
            
            // if options property exists then use select box
            if (options)
            {
                // start select drop down
                html.push('<select name="' + name + '" ' + htmlStyleAttr + htmlTypeAttr + htmlRequiredAttr + ' onfocus="YAHOO.APIViewer.configTooltip(this);" onblur="YAHOO.APIViewer.configTooltip(this);" class="field">');
                html.push('<option value="">---</option>');
                
                // loop through each option
                for (var x in options)
                {
                    var value = options[x],
                        selected = '';
                    
                    // highlight default value if existsdefault value
                    if (attrDefault && attrDefault == value)
                    {
                        selected = 'selected';
                    }
                
                    // create option html
                    html.push('<option value="' + value + '" ' + selected + '>' + value + '</option>');
                }
                
                // close select box
                html.push('</select>');
            }
            // otherwise use input field
            else
            {
                // default value
                if (attrDefault)
                {
                    htmlDefaultAttr = attrDefault;
                }
            
                html.push('<input type="text" value="' + htmlDefaultAttr + '" name="' + name + '" id="' + name + '" ' + htmlStyleAttr + htmlTypeAttr + htmlRequiredAttr + ' onfocus="YAHOO.APIViewer.configTooltip(this);" onblur="YAHOO.APIViewer.configTooltip(this);" class="field">');
            }
            
            return html.join("\n");
        },
        
        /**
         * Display the API headers
         * @method renderAPIHeaders
         * @param {Object} data The headers to display
         * @return {String} HTML output of the headers
         */
        renderAPIHeaders : function(data)
        {
            var html;
            
            if (typeof data === 'string')
            {
                html = data;
            }
            else
            {
                html = [];
                
                for (header in data)
                {
                    html.push('<li><strong>' + header + ':</strong> ' + data[header] + '</li>');
                }
                
                html = html.join('\n');
            }
            
            return html;
        },
        
        /**
         * Parse the form fields and build API URI to call
         * @method setAPIURI
         * @param {Event} e The form submit event
         * @return null
         * @TODO get fields by class name and use switch to determine how to build HTML
         */
        setAPIURI : function(e)
        {
            // prevent form submit
            if (e) Event.preventDefault(e);
            
            // api uri to call
            var uri = '';
            
            // set servers
            if (this.el.form.server.selectedIndex == -1)
            {
                this.renderMessage(this.defs.MESSAGE_SELECT_SERVER, true);
                this.el.form.server.focus();
                return false;
            }
            else
            {
                uri = this.el.form.server[this.el.form.server.selectedIndex].value + '/';
            }
            
            // set apis
            if (!this.selectedAPI)
            {
                this.renderMessage(this.defs.MESSAGE_SELECT_API, true);
                return false;
            }
            else
            {
                // API might contain resources that need replacing '/open/v1/{uuid}'
                // since the API was already selected, we can check if the fields exist on the page
                // if so, replace field values with resources that need to be replaced
                var li = this.el.path.getElementsByTagName('li'),
                    ln = li.length;
                if (ln > 0)
                {
                    var path = '',
                        count = 0;
                        
                    // loop through each resource to find replacement
                    for (var x = 0; x < ln; x++)
                    {
                        // get path from header
                        if (Dom.hasClass(li[x], 'header'))
                        {
                            path += li[x].innerHTML;
                            
                            continue;
                        }
                        
                        // parse each field in the path
                        var field = Dom.getElementsByClassName('field', null, li[x])[0];
                        if (field)
                        {
                            // get parameter attributes
                            var nodeName = field.nodeName.toLowerCase(),
                                fieldName = field.getAttribute('name'),
                                fieldValue = field.value,
                                fieldStyle = field.getAttribute('data-style') || 'plain',
                                fieldType = field.getAttribute('data-type') || 'xsd:string';
                            
                            if (fieldStyle)
                            {
                                switch(fieldStyle)
                                {
                                    // replace template in path with value
                                    case 'template' :
                                        var re = new RegExp("{" + fieldName + ".*}$", "i");
                                        path = path.replace(re, fieldValue);
                                        
                                        break;
                                    
                                    // build matrix key value pair
                                    case 'matrix' :
                                        // if field is boolean, then only display when true
                                        if (fieldType == 'xsd:boolean' && (fieldValue == 'true' || fieldValue == '1'))
                                        {
                                            path += ';' + fieldName;
                                        }
                                        
                                        // if value is empty, then build matrix parameter
                                        if (fieldType != 'xsd:boolean' && fieldValue != '')
                                        {
                                            path += ';' + fieldName + this.checkFieldCharacter(fieldName) + fieldValue;
                                        }
                                        
                                        break;
                                } // end switch - fieldStyle
                            } // end if - fieldStyle
                        } // end if - field
                    }
                    
                    // add path to uri
                    uri += path;
                } // end if - list elements
            }
            
            // set api parameters            
            uri += '?';
            
            // find all query fields
            var fields = Dom.getElementsByClassName('field', null, this.el.query);
            for (var x = 0, xln = fields.length; x < xln; x++)
            {
                if (fields[x].value != '')
                {
                    // query name
                    uri += fields[x].name + this.checkFieldCharacter(fields[x].name) + fields[x].value + '&';
                }
            }
            
            // get all headers
            var headers = [],
                fields = Dom.getElementsByClassName('field', null, this.el.headers);
            for (var x = 0, xln = fields.length; x < xln; x++)
            {
                if (fields[x].value != '')
                {
                    headers.push(fields[x].name + '|' + fields[x].value);
                }
            }
            
            // remove trailing '&' if set from config
            if (uri.charAt(uri.length - 1) == "&") uri = uri.substring(0, uri.length - 1);
            
            // fire API call
            this.renderAPI(uri, headers);
        },
        
        /**
         * Show the API in an iframe on the page
         * @method renderAPI
         * @param {String} uri The URI to display in an iframe
         * @param {Object} headers The object that lists each custom header
         * @return null
         */
        renderAPI : function(uri, headers)
        {
            // make sure uri is sent
            if (!uri || uri == '')
            {
                this.renderMessage(this.defs.ERROR_INVALID_API, true);
                return false;
            }
            
            // ajax to remove item from db
            var callback =
            {
                success : function(o)
                {
                    // parse the data
                    var json = JSON.parse(o.responseText);
                    
                    var html = [
                        '<div class="hd">',
                            '<h2>' + this.defs.VIEWER_TITLE + '</h2>',
                            '<div class="links">',
                                '<a href="#" class="iresize">' + this.defs.EXPAND + '</a> | ',
                                '<a href="#" class="iview req-header">' + this.defs.REQUEST_HEADERS + '</a> | ',
                                '<a href="#" class="iview resp-header">' + this.defs.RESPONSE_HEADERS + '</a> | ',
                                '<a href="' + uri + '" target="_blank" class="inew">' + this.defs.VIEW + '</a>',
                                (!this.debug ? ' | <a href="#" class="ilink">' + this.defs.LINK + '</a>' : ''),
                            '</div>',
                        '</div>',
                        '<input type="text" value="' + uri.replace(/\&/, '&amp;') + '" onfocus="this.select();" readonly="readonly" />',
                        '<div id="api-req-headers" class="api-req-headers hide"><h3>' + this.defs.REQUEST_HEADERS + '</h3><a href="#" class="close" onclick="YAHOO.APIViewer.clearOverlays(); return false;">X</a><ul class="list">' + this.renderAPIHeaders(json.req_headers) + '</ul></div>',
                        '<div id="api-resp-headers" class="api-resp-headers hide"><h3>' + this.defs.RESPONSE_HEADERS + '</h3><a href="#" class="close" onclick="YAHOO.APIViewer.clearOverlays(); return false;">X</a><ul class="list">' + this.renderAPIHeaders(json.resp_headers) + '</ul></div>',
                        '<div class="output"><pre>' + json.data + '</pre></div>',
                    ].join('\n');
                
                    // display api data
                    this.el.viewer.innerHTML = html;
                    
                    if (json.status_code == '200' && !this.debug)
                    {
                        // get alias for current configurations
                        this.getAlias(uri);
                    }
                    
                    // remove classes
                    Dom.removeClass(this.el.viewer, 'loading');
                    Dom.removeClass(this.el.viewer, 'hide');
                    
                    // hide message
                    this.renderMessage(' ');
                    
                    // hide recent queries
                    Dom.addClass(this.el.history, 'hide');
                },
                failure : function(o)
                {
                    this.renderMessage(this.defs.ERROR_API_LOAD + '<br><br><a href="'+uri+'" target="_blank">'+uri+'</a>', true);
                    
                    // remove classes
                    Dom.removeClass(this.el.viewer, 'loading');
                },
                scope : this,
                cache : false
            }
            
            // create custom headers
            if (headers.length > 0)
            {
                for (var i in headers)
                {
                    var split = headers[i].split('|');
                    Connect.initHeader(split[0], split[1]);
                }
            }
            
            // fire ajax call
            var params = 'uri=' + encodeURIComponent(uri);
            Connect.asyncRequest('GET', '/parse?' + params, callback);
            
            // show loading treatment
            Dom.addClass(this.el.viewer, 'loading');
                    
            // for first time call, display loading in message
            if (this.el.viewer.innerHTML == '')
            {
                this.renderMessage(this.loadingImgHTML + this.defs.LOADING_API);
            }
        },
        
        /**
         * Get the permalink of current configuration
         * @method getAlias
         * @param {Object} el The trigger element clicked
         * @return null
         */
        getAlias : function(uri)
        {
            var options = {};
            
            // get parameters for each field set
            options['property'] = this.getProperty();
            options['server'] = this.getServer();
            options['api'] = this.getAPI();
            options['path'] = this.getParams(this.el.path);
            options['query'] = this.getParams(this.el.query);
            
            // combine all options into query params to send to API
            var params = '&params=' + YAHOO.lang.JSON.stringify(options) + '&' + this.renderDebugParameter();
            
            // clean uri
            var uri = encodeURIComponent(uri);
            
            var callback = {
                success : function(o)
                {
                    var json = JSON.parse(o.responseText);
                    if (json.status_code === 200 && json.data)
                    {
                        // check if current hash is same as returned from data, if not then set it
                        //if (!document.location.hash || document.location.hash != '#' + json.data)
                        //{
                        //    document.location.hash = json.data;
                        //}
                            
                        // fire custom event
                        this.events.onGetAliasSuccess.fire(json.data, uri);
                    }
                            
                    return json.data;
                },
                error : function(o)
                {
                    return false;  
                },
                scope : this
            };
            
            var trans = Connect.asyncRequest('POST', '/bookmark', callback, 'type=add&uri=' + uri + params);
        },
        
        /**
         * Return the current debug state
         * @method getDebug
         * @return {String} The debug state
         */
        getDebug : function()
        {
            return this.debug;
        },
        
        /**
         * Retrieve the currently selected property
         * @method getProperty
         * @return {String} The property form field selected
         */
        getProperty : function()
        {
            return this.property;
        },
        
        /**
         * Return the hostname selected
         * @method getServer
         * @return {String} The host form field selected
         */
        getServer : function()
        {
            return this.el.form.server.value;
        },
        
        /**
         * Return the API selected
         * @method getAPI
         * @return {String} The API selected
         */
        getAPI : function()
        {
            return this.selectedAPI.value;
        },
        
        /**
         * Parse form fields for key value pair of parameters. Works with path and query param fieldset.
         * @method getParams
         * @param {String} el The element that contains the fields to parse
         * @return {String} The key value parameter pairs
         */
        getParams : function(el)
        {
            if (!el) return false;
            
            var path = [],
                fields = Dom.getElementsByClassName('field', null, el);
                
            if (fields)
            {
                for (var i=0, ln = fields.length; i < ln; i++)
                {
                    path.push(fields[i].getAttribute('name') + '=' + fields[i].value);
                } // end for
            }
            
            return (path.length > 0) ? path.join('|') : '';
        },
        

        
        /**
         * Given hash alias, build configurations
         * @method parseAlias
         * @param {String} alias The alias to parse
         * @return null
         */
        parseAlias : function(alias)
        {
            if (!alias || alias === '#') return false;
            
            // remove old custom events
            this.clearCustomEvents();
            
            var callback = {
                success : function(o)
                {
                    var json = JSON.parse(o.responseText);
                    if (json.status_code === 200)
                    {
                        this.aliasParams = json.data;
                        
                        // highlight property
                        this.setProperty(this.aliasParams.property);
            
                        // highlight host select box
                        this.events.onRenderServersSuccess.subscribe(
                            function(e, args, that) {
                                that.setServer(that.aliasParams.server);
                            }, this
                        );
                        
                        // highlight selected api
                        this.events.onRenderAPIsSuccess.subscribe(
                            function(e, args, that) {
                                that.setAPI(that.aliasParams.api);
                            }, this
                        );
                        
                        // fill out path and query parameters
                        this.events.onRenderParamsSuccess.subscribe(
                            function(e, args, that) {
                                that.setParams(that.aliasParams.path, that.el.path);
                                that.setParams(that.aliasParams.query, that.el.query);
                                                                
                                // set URI and render it
                                that.setAPIURI();
                            }, this
                        );
                    }
                    else
                    {
                        this.renderMessage(this.defs.ERROR_ALIAS, true);
                    }
                },
                error : function(o)
                {
                    this.renderMessage(this.defs.ERROR_ALIAS, true);
                },
                scope : this
            };
            
            var trans = Connect.asyncRequest('GET', '/bookmark?type=get&alias=' + alias, callback);
        },
        
        /**
         * Select the correct server name depending on URI hash
         * @method setProperty
         * @return null
         */
        setProperty : function(property)
        {
            if (property == '') return false;
            
            this.property = property;
            
            // loop through property select options
            var options = this.el.form.properties.getElementsByTagName('option');
            for (var x = 0, ln = options.length; x < ln; x++)
            {
                // if option value matches host value then select it
                if (options[x].value == this.property)
                {
                    this.el.form.properties.selectedIndex = x;
                    
                    // fire ajax call to get servers and APIs for property selected
                    this.getPropertyConfigs(this.property);
                    
                    break;
                }
            }
        },
        
        /**
         * Select the correct server name depending on URI hash
         * @method setServer
         * @param {String} e The name of the custom event fired
         * @param {Object} data The data returned from the custom event
         * @param {Object} obj Data object containing 'this' reference and host value
         * @return null
         */
        setServer : function(host)
        {
            var nodes = this.el.servers.getElementsByTagName('SELECT')[0];
            if (nodes)
            {
                // loop through select options
                for (var x = 0, ln = nodes.options.length; x < ln; x++)
                {
                    // if option value matches host value then select it
                    if (nodes.options[x].value == host)
                    {
                        nodes.selectedIndex = x;
                        break;
                    }
                }
            } 
        },
        
        /**
         * Break apart hash URI into segments and build form fields
         * @method setAPI
         * @param {String} e The name of the custom event fired
         * @param {Object} data The data returned from the custom event
         * @param {Object} obj Data object containing 'this' reference and api value
         * @return null
         */
        setAPI : function(api)
        {
            var nodes = this.el.apis.getElementsByTagName('LABEL');
            if (nodes)
            {
                // loop through nodes
                for (var x = 0, ln = nodes.length; x < ln; x++)
                {
                    // if a node matches api path, then select it and fire ajax to get data
                    if (nodes[x].id == api)
                    {
                        this.selectAPI(nodes[x]);
                        
                        this.getAPIPathAndQuery(nodes[x].id);
                        
                        break;
                    }
                }
            }
        },
        
        /**
         * Parse the form fields and build API URI to display on page
         * @method setParams
         * @param {String} e The name of the custom event fired
         * @param {Object} data The data returned from the custom event
         * @param {Object} self The APIViewer scope reference
         * @return null
         */
        setParams : function(data, el)
        {
            if (!data || data == '') return false;
        
            // separate query params
            var params = data.split('|'),
                fields = Dom.getElementsByClassName('field', null, el);
            
            // loop through each param and build key value object
            var arr = {};
            for (var x in params)
            {
                var param = params[x].lastIndexOf('='),
                    field = params[x].substr(0, param),
                    value = params[x].substr(param + 1);

                arr[field] = value;
            }
            
            // loop through fields and set values
            for (var y = 0, ln = fields.length; y < ln; y++)
            {
                // get element nodename
                var nodeName = fields[y].nodeName.toLowerCase();
                
                // get name attribute from node
                var nameAttr = fields[y].getAttribute('name');
                
                // if name attribute doesnt exist in query then skip this field
                if (!arr[nameAttr]) continue;
                
                // set values based on tag type
                switch(nodeName)
                {
                    case 'select' :
                        // loop through each option
                        for (var z = 0, sln = fields[y].options.length; z < sln; z++)
                        {
                            // if option value matches query param value, then select it
                            if (fields[y].options[z].value == arr[nameAttr])
                            {
                                fields[y].selectedIndex = z;
                                break;
                            }
                        }
                        break;
                    default : 
                        // set value param fields to query value
                        fields[y].value = arr[nameAttr];
                        break;
                }
            }
        },
        
        /**
         * Add successful API URI to recent queries
         * @method addURIToHistory
         * @param {String} uri The web address to add to recent queries
         * @return null
         */
        addURIToHistory : function(uri, alias)
        {
            if (!this.el.history || !uri || uri == '') return false;
            
            var uri = decodeURIComponent(uri);
            
            // get element list
            if (!this.el.history.ul) this.el.history.ul = this.el.history.getElementsByTagName('UL')[0];
            
            // list item
            var html = '<li><a href="' + uri + '" target="_blank" rel="' + alias + '">' + uri.replace(/\&/g,'&amp;') + '</a></li>';
            
            // check for dups in list
            var items = this.el.history.ul.getElementsByTagName('A');
            for (var i=0, ln=items.length; i<ln; i++)
            {
                if (items[i].href == uri) return false;
            }
            
            // set new uri to top of list
            this.el.history.ul.innerHTML = html + this.el.history.ul.innerHTML;
        },
        
        
        /**
         * Return key value debug string
         * @method renderDebugParameter
         * @return {String} The debug key value string
         */
        renderDebugParameter : function()
        {
            return 'debug=' + this.debug;
        },
        
        /**
         * Show a help message to user
         * @method renderHelp
         * @param {String} msg The message to display on the page
         * @return null
         */
        renderHelp : function(msg)
        {
            // make sure message exists
            if (!msg) return false;
            
            // remove hide class
            if (msg == ' ')
            {
                Dom.addClass(this.el.help, 'hide');
            }
            else
            {
                // set new message
                this.el.help.innerHTML = this.configSentence(msg);
                
                Dom.removeClass(this.el.help, 'hide');
            }
        },
        
        /**
         * Show a help/status message to user
         * @method renderMessage
         * @param {String} msg The message to display on the page
         * @return null
         */
        renderMessage : function(msg, error)
        {
            // make sure message exists
            if (!msg) return false;
            
            if (msg == ' ')
            {
                Dom.addClass(this.el.message, 'hide');
                Dom.removeClass(this.el.message, 'error');
            }
            else
            {
                this.el.message.innerHTML = this.configSentence(msg);
            
                Dom.removeClass(this.el.message, 'hide');
                
                if (error)
                {
                    Dom.addClass(this.el.message, 'error');
                }
                else
                {
                    Dom.removeClass(this.el.message, 'error');
                }
            }
        },
        
        /**
         * If field name has ':' at the end, don't include '=' sign
         * @method checkFieldCharacter
         * @param {String} field The field to parse
         * @return {String} Equal sign or empty
         */
        checkFieldCharacter : function(field)
        {
            if (field == '') return '';
            return (field.charAt(field.length - 1) != ':') ? '=' : '';
        },       
        
        /**
         * Grab the description from parameter and display on page
         * @method configTooltip
         * @param {Object} el The element to get preview from
         * @return null
         */
        configTooltip : function(el)
        {
            if (!el)
            {
                this.renderMessage(this.defs.ERROR_PARAM_PREV);
                return false;
            }
            
            // grab input and grab right coordinate to use for tooltip "left" property
            var node = el.parentNode.getElementsByTagName('select')[0];
            if (!node) node = el.parentNode.getElementsByTagName('input')[0];
            var region = Dom.getRegion(node);

            // check for old tooltip and remove it
            var node = el.parentNode.getElementsByTagName('div')[0];
            if (node)
            {
                el.parentNode.removeChild(node);
                return false;
            }
            
            // grab label from parent node            
            var label = el.parentNode.getElementsByTagName('label')[0];
            if (label)
            {
                var node = document.createElement('div');
                Dom.addClass(node, 'tooltip');
                Dom.setStyle(node, 'left', region.right + 'px');
                node.innerHTML = '<em>' + this.configSentence(label.title) + '</em><span/>';
                el.parentNode.appendChild(node);
            }
        },
        
        /**
         * Capitalize the first letter and add period to end of sentence.
         * @method configSentence
         * @param {String} msg The message to be formatted
         * @return {String} msg The formatted message
         */
        configSentence : function(msg)
        {
            // capitalize first letter
            var firstLetter = msg.substr(0, 1);
            msg = firstLetter.toUpperCase() + msg.substr(1);
            
            // add period to end of sentence if doesnt exist
            //if (msg != ' ' && msg.charAt(msg.length - 1) != ".") msg = msg + '.';
            
            return msg;
        },
        
        /**
         * Reset the viewer to default state
         * @method clearViewer
         * @return null
         */
        clearViewer : function()
        {
            // reset messages
            this.renderMessage(this.defs.MESSAGE_SELECT_PROPERTY);
            
            // hide servers, apis, params and buttons fieldsets
            Dom.addClass(this.el.servers, 'hide');
            Dom.addClass(this.el.apis, 'hide api-apis-fixed');
            Dom.addClass(this.el.path, 'hide');
            Dom.addClass(this.el.params, 'hide');
            Dom.addClass(this.el.headers, 'hide');
            Dom.addClass(this.el.query, 'hide');
            Dom.addClass(this.el.buttons, 'hide');
            Dom.addClass(this.el.viewer, 'hide');
            Dom.removeClass(this.el.history, 'hide');
            
            // remove previous viewer 
            this.el.viewer.innerHTML = '';
            
            // reset document hash
            document.location.hash = '';
            
            // remove custom events
            this.clearCustomEvents();
        },
        
        /**
         * Remove custom events
         * @method clearCustomEvents
         * @return null
         */
        clearCustomEvents : function()
        {
            this.events.onRenderServersSuccess.unsubscribe();
            this.events.onRenderAPIsSuccess.unsubscribe();
            this.events.onRenderParamsSuccess.unsubscribe();
        },
        
        /**
         * Clear the previous APIs parameters
         * @method clearAPIParams
         * @return null
         */
        clearAPIParams : function()
        {
            // reset messages
            this.renderMessage(this.defs.MESSAGE_SELECT_API);
            
            // hide params and buttons fieldsets
            Dom.addClass(this.el.path, 'hide');
            Dom.addClass(this.el.params, 'hide');
            Dom.addClass(this.el.headers, 'hide');
            Dom.addClass(this.el.query, 'hide');
            //Dom.addClass(this.el.buttons, 'hide');
            
            // reset path and query lists
            this.el.path.getElementsByTagName('ol')[0].innerHTML = '';
            this.el.headers.getElementsByTagName('ol')[0].innerHTML = '';
            this.el.query.getElementsByTagName('ol')[0].innerHTML = '';
            
            // remove previous viewer 
            this.el.viewer.innerHTML = '';
            
            // remove selected api
            this.deselectAPI();
        },
        
        /**
         * Hide the overlays displayed on the page
         * @method clearOverlays
         * @return null
         */
        clearOverlays : function()
        {
            Dom.replaceClass(this.el.req_headers, '', 'hide');
            Dom.replaceClass(this.el.resp_headers, '', 'hide');
        }
        
    } // end APIViewer
})();
