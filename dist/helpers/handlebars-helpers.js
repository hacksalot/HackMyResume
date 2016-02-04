
/**
Template helper definitions for Handlebars.
@license MIT. Copyright (c) 2015 James Devlin / FluentDesk.
@module handlebars-helpers.js
 */

(function() {
  var HANDLEBARS, _, helpers;

  HANDLEBARS = require('handlebars');

  _ = require('underscore');

  helpers = require('./generic-helpers');


  /**
  Register useful Handlebars helpers.
  @method registerHelpers
   */

  module.exports = function(theme, opts) {
    helpers.theme = theme;
    helpers.opts = opts;
    return HANDLEBARS.registerHelper(helpers);
  };

}).call(this);

//# sourceMappingURL=handlebars-helpers.js.map
