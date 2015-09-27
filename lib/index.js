'use strict';

var _ = require('lodash');
var samlHapi = require('./saml-hapi');

// Declare internals
var internals = {};

/**
 * Method to register the plugin with hapi
 * @param {object} server The server object
 * @param {object} options Additional options object
 * @param {function} next Callback function once plugin is registered
 */
exports.register = function (server, options, next) {
  server.auth.scheme('saml', internals.implementation);
  //server.auth.strategy('saml-strategy', 'saml', options.samlOptions);
  next();
};

exports.register.attributes = {
  pkg: require('../package.json')
};

//Auth Scheme Implementation Template
internals.implementation = function (requestServer, requestOptions) {
    var settings = _.clone(requestOptions);
    return {
      authenticate: samlHapi.authenticate(settings)
    };
};

