
/**
Definition of the JRSGenerator class.
@license MIT. See LICENSE.md for details.
@module renderers/jrs-generator
 */

(function() {
  var FS, HANDLEBARS, JRSGenerator, MD, MDIN, PATH, READFILES, SLASH, _, parsePath, registerHelpers;

  _ = require('underscore');

  HANDLEBARS = require('handlebars');

  FS = require('fs');

  registerHelpers = require('../helpers/handlebars-helpers');

  PATH = require('path');

  parsePath = require('parse-filepath');

  READFILES = require('recursive-readdir-sync');

  SLASH = require('slash');

  MD = require('marked');


  /**
  Perform template-based resume generation for JSON Resume themes.
  @class JRSGenerator
   */

  JRSGenerator = module.exports = {
    generate: function(json, jst, format, cssInfo, opts, theme) {
      var org, rezHtml, turnoff;
      turnoff = ['log', 'error', 'dir'];
      org = turnoff.map(function(c) {
        var ret;
        ret = console[c];
        console[c] = function() {};
        return ret;
      });
      rezHtml = theme.render(json.harden());
      turnoff.forEach(function(c, idx) {
        return console[c] = org[idx];
      });
      return rezHtml = rezHtml.replace(/@@@@~.*?~@@@@/gm, function(val) {
        return MDIN(val.replace(/~@@@@/gm, '').replace(/@@@@~/gm, ''));
      });
    }
  };

  MDIN = function(txt) {
    return MD(txt || '').replace(/^\s*<p>|<\/p>\s*$/gi, '');
  };

}).call(this);

//# sourceMappingURL=jrs-generator.js.map
