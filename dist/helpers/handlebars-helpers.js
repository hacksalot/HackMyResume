
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

  module.exports = function(theme, rez, opts) {
    var curGlob, ex, glob, slash, wrappedHelpers;
    helpers.theme = theme;
    helpers.opts = opts;
    helpers.type = 'handlebars';
    wrappedHelpers = _.mapObject(helpers, function(hVal, hKey) {
      if (_.isFunction(hVal)) {
        return _.wrap(hVal, function(func) {
          var args;
          args = Array.prototype.slice.call(arguments);
          args.shift();
          args[args.length - 1] = rez;
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
      slash = require('slash');
      curGlob = null;
      try {
        _.each(theme.helpers, function(fGlob) {
          var files;
          curGlob = fGlob;
          fGlob = path.join(theme.folder, fGlob);
          files = glob.sync(slash(fGlob));
          if (files.length > 0) {
            _.each(files, function(f) {
              HANDLEBARS.registerHelper(require(f));
            });
          } else {
            throw {
              fluenterror: HMS.themeHelperLoad,
              inner: er,
              glob: fGlob
            };
          }
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
