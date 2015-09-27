'use strict';

/**
 * SAML wrapper to make it compatible with hapijs auth scheme interface.
 */

/*
http://hapijs.com/tutorials/auth#schemes
Refer above link for spec information, as to interface requirements for a hapi auth scheme spec.
Basically, min requirement is to have a wrapper method, which must return an object with at least the key authenticate (as a fn)
 */

var Boom = require('boom');
var Saml = require('./saml.js');
var wrapper = {};

wrapper.authenticate = function(options) {
  var saml = new Saml.SAML(options);

  options.samlFallback = options.samlFallback || 'login-request';

  // Optional verify function.
  // Returns profile as is by default
  options.verifyFunc = options.verifyFunc || function(profile, done) {
    return done(null, profile);
  };

  return function(request, reply) {
    function validateCallback(err, profile, loggedOut) {

      if (err) {
        return reply(Boom.internal(err));
      }

      if (loggedOut) {
        request.logout();
        if (profile) {
          request.samlLogoutRequest = profile;

          console.log(['debug', 'logout'], 'Logging out profile');
          return saml.getLogoutResponseUrl(request, redirectIfSuccess);
        }
        return reply();
      }

      var verified = function (err, user, info) {
        // console.log(['debug', 'verified', 'user'], user);

        if (err) {
          return reply(err);
        }

        if (!user) {
          return reply(Boom.badRequest(info));
        }

        reply(null, {
          credentials: user,
          info: info
        });
      };

      // Client verification of whether profile is valid or not.
      options.verifyFunc(profile, verified);
    }

    function redirectIfSuccess(err, url) {
      if (err) {
        return reply(Boom.internal(err));
      } else {
        reply.redirect(url);
      }
    }

    if (request.payload && request.payload.SAMLResponse) {
      saml.validatePostResponse(request.payload, validateCallback);
    } else if (request.payload && request.payload.SAMLRequest) {
      saml.validatePostRequest(request.payload, validateCallback);
    } else {
      var operation = {
        'login-request': 'getAuthorizeUrl',
        'logout-request': 'getLogoutUrl'
      }[options.samlFallback];

      if (!operation) {
        return reply(Boom.internal('No operation'));
      }
      saml[operation](request, redirectIfSuccess);
    }
  };

};

module.exports = wrapper;
