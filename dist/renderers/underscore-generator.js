
/**
Definition of the UnderscoreGenerator class.
@license MIT. See LICENSE.md for details.
@module underscore-generator.js
 */

(function() {
  var UnderscoreGenerator, _, escapeLaTeX, registerHelpers;

  _ = require('underscore');

  registerHelpers = require('../helpers/underscore-helpers');

  require('../utils/string');

  escapeLaTeX = require('escape-latex');


  /**
  Perform template-based resume generation using Underscore.js.
  @class UnderscoreGenerator
   */

  UnderscoreGenerator = module.exports = {
    generateSimple: function(data, tpl) {
      var HMS, t;
      try {
        t = _.template(tpl);
        return t(data);
      } catch (_error) {
        HMS = require('../core/status-codes');
        throw {
          fluenterror: HMS[t ? 'invokeTemplate' : 'compileTemplate'],
          inner: _error
        };
      }
    },
    generate: function(json, jst, format, cssInfo, opts, theme) {
      var ctx, delims, r, traverse;
      delims = (opts.themeObj && opts.themeObj.delimeters) || opts.template;
      if (opts.themeObj && opts.themeObj.delimeters) {
        delims = _.mapObject(delims, function(val, key) {
          return new RegExp(val, "ig");
        });
      }
      _.templateSettings = delims;
      r = null;
      switch (format) {
        case 'html':
          r = json.markdownify();
          break;
        case 'pdf':
          r = json.markdownify();
          break;
        case 'png':
          r = json.markdownify();
          break;
        case 'latex':
          traverse = require('traverse');
          r = traverse(json).map(function(x) {
            if (this.isLeaf && String.is(this.node)) {
              return escapeLaTeX(this.node);
            }
            return this.node;
          });
          break;
        default:
          r = json;
      }
      ctx = {
        r: r,
        filt: opts.filters,
        XML: require('xml-escape'),
        RAW: json,
        cssInfo: cssInfo,
        headFragment: opts.headFragment || '',
        opts: opts
      };
      registerHelpers(theme, opts, cssInfo, ctx, this);
      return this.generateSimple(ctx, jst);
    }
  };

}).call(this);

//# sourceMappingURL=underscore-generator.js.map
