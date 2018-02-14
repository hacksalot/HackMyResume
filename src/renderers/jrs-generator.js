/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Definition of the JRSGenerator class.
@license MIT. See LICENSE.md for details.
@module renderers/jrs-generator
*/

const _ = require('underscore');
const HANDLEBARS = require('handlebars');
const FS = require('fs');
const registerHelpers = require('../helpers/handlebars-helpers');
const PATH = require('path');
const parsePath = require('parse-filepath');
const READFILES = require('recursive-readdir-sync');
const SLASH = require('slash');
const MD = require('marked');

/**
Perform template-based resume generation for JSON Resume themes.
@class JRSGenerator
*/

const JRSGenerator = (module.exports = {

  generate( json, jst, format, cssInfo, opts, theme ) {

    // Disable JRS theme chatter (console.log, console.error, etc.)
    const turnoff = ['log', 'error', 'dir'];
    const org = turnoff.map(function(c) {
      const ret = console[c];
      console[c] = function() {};
      return ret;
    });

    // Freeze and render
    let rezHtml = theme.render(json.harden());

    // Turn logging back on
    turnoff.forEach((c, idx) => console[c] = org[idx]);

    // Unfreeze and apply Markdown
    return rezHtml = rezHtml.replace(/@@@@~[\s\S]*?~@@@@/g, val => MDIN( val.replace( /~@@@@/g,'' ).replace( /@@@@~/g,'' ) ));
  }
});


var MDIN = txt => // TODO: Move this
  MD(txt || '' ).replace(/^\s*<p>|<\/p>\s*$/gi, '')
;
