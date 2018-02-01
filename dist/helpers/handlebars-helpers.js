
/**
Template helper definitions for Handlebars.
@license MIT. See LICENSE.md for details.
@module handlebars-helpers.js
 */

(function() {
  var HANDLEBARS, HMS, _, blockHelpers, helpers, path;

  HANDLEBARS = require('handlebars');

  _ = require('underscore');

  helpers = require('./generic-helpers');

  path = require('path');

  blockHelpers = require('./block-helpers');

  HMS = require('../core/status-codes');


  /**
  Register useful Handlebars helpers.
  @method registerHelpers
   */

  module.exports = function(theme, opts) {
    var curGlob, ex, glob, wrappedHelpers;
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
    if (_.isString(theme.helpers)) {
      theme.helpers = [theme.helpers];
    }
    if (_.isArray(theme.helpers)) {
      glob = require('glob');
      curGlob = null;
      try {
        _.each(theme.helpers, function(fGlob) {
          curGlob = fGlob;
          fGlob = path.join(theme.folder, fGlob);
          glob(fGlob, {}, function(er, files) {
            if (er === null && files.length > 0) {
              _.each(files, function(f) {
                HANDLEBARS.registerHelper(require(f));
              });
            }
          });
        });
      } catch (_error) {
        ex = _error;
        throw {
          fluenterror: HMS.themeHelperLoad,
          inner: ex,
          glob: curGlob,
          exit: true
        };
      }
    }
  };

}).call(this);

//# sourceMappingURL=handlebars-helpers.js.map
