/**
Template helper definitions for Handlebars.
@license MIT. Copyright (c) 2015 James Devlin / FluentDesk.
@module handlebars-helpers.js
*/


(function() {

  var HANDLEBARS = require('handlebars')
  , _ = require('underscore')
  , helpers = require('./generic-helpers');

  /**
  Register useful Handlebars helpers.
  @method registerHelpers
  */
  module.exports = function( theme ) {

    helpers.theme = theme;
    HANDLEBARS.registerHelper( helpers );

  };

}());
