
/**
Template helper definitions for Underscore.
@license MIT. See LICENSE.md for details.
@module handlebars-helpers.js
 */

(function() {
  var HANDLEBARS, _, helpers;

  HANDLEBARS = require('handlebars');

  _ = require('underscore');

  helpers = require('./generic-helpers');


  /**
  Register useful Underscore helpers.
  @method registerHelpers
   */

  module.exports = function(theme, opts, cssInfo, ctx, eng) {
    helpers.theme = theme;
    helpers.opts = opts;
    helpers.cssInfo = cssInfo;
    helpers.engine = eng;
    ctx.h = helpers;
    _.each(helpers, function(hVal, hKey) {
      if (_.isFunction(hVal)) {
        return _.bind(hVal, ctx);
      }
    }, this);
  };

}).call(this);

//# sourceMappingURL=underscore-helpers.js.map
