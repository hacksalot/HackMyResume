
/**
Definition of the UnderscoreGenerator class.
@license MIT. See LICENSE.md for details.
@module underscore-generator.js
 */

(function() {
  var HMSTATUS, UnderscoreGenerator, _, registerHelpers;

  _ = require('underscore');

  registerHelpers = require('../helpers/underscore-helpers');

  HMSTATUS = require('../core/status-codes');


  /**
  Perform template-based resume generation using Underscore.js.
  @class UnderscoreGenerator
   */

  UnderscoreGenerator = module.exports = {
    generateSimple: function(data, tpl) {
      var template;
      try {
        template = _.template(tpl);
        return template(data);
      } catch (_error) {
        throw {
          fluenterror: template ? HMSTATUS.invokeTemplate : HMSTATUS.compileTemplate,
          inner: _error
        };
      }
    },
    generate: function(json, jst, format, cssInfo, opts, theme) {
      var ctx, delims;
      delims = (opts.themeObj && opts.themeObj.delimeters) || opts.template;
      if (opts.themeObj && opts.themeObj.delimeters) {
        delims = _.mapObject(delims, function(val, key) {
          return new RegExp(val, "ig");
        });
      }
      _.templateSettings = delims;
      jst = jst.replace(delims.comment, '');
      ctx = {
        r: format === 'html' || format === 'pdf' || format === 'png' ? json.markdownify() : json,
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
