(function() {
  /**
  Definition of the UnderscoreGenerator class.
  @license MIT. See LICENSE.md for details.
  @module underscore-generator.js
  */
  /**
  Perform template-based resume generation using Underscore.js.
  @class UnderscoreGenerator
  */
  var UnderscoreGenerator, _, escapeLaTeX, registerHelpers;

  _ = require('underscore');

  registerHelpers = require('../helpers/underscore-helpers');

  require('../utils/string');

  escapeLaTeX = require('escape-latex');

  UnderscoreGenerator = module.exports = {
    generateSimple: function(data, tpl) {
      var HMS, err, t;
      try {
        // Compile and run the Handlebars template.
        t = _.template(tpl);
        return t(data);
      } catch (error) {
        err = error;
        //console.dir _error
        HMS = require('../core/status-codes');
        throw {
          fluenterror: HMS[t ? 'invokeTemplate' : 'compileTemplate'],
          inner: err
        };
      }
    },
    generate: function(json, jst, format, cssInfo, opts, theme) {
      var ctx, delims, r, traverse;
      // Tweak underscore's default template delimeters
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
      // Set up the context
      ctx = {
        r: r,
        filt: opts.filters,
        XML: require('xml-escape'),
        RAW: json,
        cssInfo: cssInfo,
        //engine: @
        headFragment: opts.headFragment || '',
        opts: opts
      };
      // Link to our helpers
      registerHelpers(theme, opts, cssInfo, ctx, this);
      // Generate!
      return this.generateSimple(ctx, jst);
    }
  };

}).call(this);

//# sourceMappingURL=underscore-generator.js.map
