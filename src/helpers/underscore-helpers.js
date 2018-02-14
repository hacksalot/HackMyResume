/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Template helper definitions for Underscore.
@license MIT. See LICENSE.md for details.
@module handlebars-helpers.js
*/



const _ = require('underscore');
const helpers = require('./generic-helpers');



/**
Register useful Underscore helpers.
@method registerHelpers
*/
module.exports = function( theme, opts, cssInfo, ctx, eng ) {
  helpers.theme = theme;
  helpers.opts = opts;
  helpers.cssInfo = cssInfo;
  helpers.engine = eng;
  ctx.h = helpers;
  _.each(helpers, function( hVal ) {
    if (_.isFunction(hVal)) {
      return _.bind(hVal, ctx);
    }
  }
  , this);
};
