
/**
Template helper definitions for Handlebars.
@license MIT. See LICENSE.md for details.
@module handlebars-helpers.js
 */

(function() {
  var HANDLEBARS, _, blockHelpers, helpers;

  HANDLEBARS = require('handlebars');

  _ = require('underscore');

  helpers = require('./generic-helpers');

  blockHelpers = require('./block-helpers');


  /**
  Register useful Handlebars helpers.
  @method registerHelpers
   */

  module.exports = function(theme, opts) {
    var wrappedHelpers;
    helpers.theme = theme;
    helpers.opts = opts;
    helpers.type = 'handlebars';
    wrappedHelpers = _.mapObject(helpers, function(hVal, hKey) {
      if (_.isFunction(hVal)) {
        _.wrap(hVal, function(func) {
          var args;
          args = Array.prototype.slice.call(arguments);
          args.shift();
          args.pop();
          return func.apply(this, args);
        });
      }
      return hVal;
    }, this);
    HANDLEBARS.registerHelper(wrappedHelpers);
    HANDLEBARS.registerHelper(blockHelpers);
  };

}).call(this);

//# sourceMappingURL=handlebars-helpers.js.map
