(function() {
  /**
  Definition of the JRSGenerator class.
  @license MIT. See LICENSE.md for details.
  @module renderers/jrs-generator
  */
  /**
  Perform template-based resume generation for JSON Resume themes.
  @class JRSGenerator
  */
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

  JRSGenerator = module.exports = {
    generate: function(json, jst, format, cssInfo, opts, theme) {
      var org, rezHtml, turnoff;
      // Disable JRS theme chatter (console.log, console.error, etc.)
      turnoff = ['log', 'error', 'dir'];
      org = turnoff.map(function(c) {
        var ret;
        ret = console[c];
        console[c] = function() {};
        return ret;
      });
      // Freeze and render
      rezHtml = theme.render(json.harden());
      // Turn logging back on
      turnoff.forEach(function(c, idx) {
        return console[c] = org[idx];
      });
      // Unfreeze and apply Markdown
      return rezHtml = rezHtml.replace(/@@@@~[\s\S]*?~@@@@/g, function(val) {
        return MDIN(val.replace(/~@@@@/g, '').replace(/@@@@~/g, ''));
      });
    }
  };

  MDIN = function(txt) { // TODO: Move this
    return MD(txt || '').replace(/^\s*<p>|<\/p>\s*$/gi, '');
  };

}).call(this);

//# sourceMappingURL=jrs-generator.js.map
