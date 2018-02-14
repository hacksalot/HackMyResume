/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Definition of the UnderscoreGenerator class.
@license MIT. See LICENSE.md for details.
@module underscore-generator.js
*/



const _ = require('underscore');
const registerHelpers = require('../helpers/underscore-helpers');
require('../utils/string');
const escapeLaTeX = require('escape-latex');

/**
Perform template-based resume generation using Underscore.js.
@class UnderscoreGenerator
*/
module.exports = {



  generateSimple( data, tpl ) {
    let t;
    try {
      // Compile and run the Handlebars template.
      t = _.template(tpl);
      return t(data);
    } catch (err) {
      //console.dir _error
      const HMS = require('../core/status-codes');
      throw{
        fluenterror: HMS[t ? 'invokeTemplate' : 'compileTemplate'],
        inner: err
      };
    }
  },



  generate( json, jst, format, cssInfo, opts, theme ) {

    // Tweak underscore's default template delimeters
    let delims = (opts.themeObj && opts.themeObj.delimeters) || opts.template;
    if (opts.themeObj && opts.themeObj.delimeters) {
      delims = _.mapObject(delims, (val) => new RegExp(val, 'ig'));
    }
    _.templateSettings = delims;

    // Massage resume strings / text
    let r = null;
    switch (format) {
      case 'html': r = json.markdownify(); break;
      case 'pdf': r = json.markdownify(); break;
      case 'png': r = json.markdownify(); break;
      case 'latex':
        var traverse = require('traverse');
        r = traverse(json).map(function() {
          if (this.isLeaf && String.is(this.node)) {
            return escapeLaTeX(this.node);
          }
          return this.node;
        });
        break;
      default: r = json;
    }

    // Set up the context
    const ctx = {
      r,
      filt: opts.filters,
      XML: require('xml-escape'),
      RAW: json,
      cssInfo,
      //engine: @
      headFragment: opts.headFragment || '',
      opts
    };

    // Link to our helpers
    registerHelpers(theme, opts, cssInfo, ctx, this);

    // Generate!
    return this.generateSimple(ctx, jst);
  }
};
