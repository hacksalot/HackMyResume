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

const MD = require('marked');

/**
Perform template-based resume generation for JSON Resume themes.
@class JRSGenerator
*/

module.exports = {

  generate( json, jst, format, cssInfo, opts, theme ) {

    // Disable JRS theme chatter (console.log, console.error, etc.)
    const turnoff = ['log', 'error', 'dir'];
    const org = turnoff.map(function(c) {
      const ret = console[c]; // eslint-disable-line no-console
      console[c] = function() {}; // eslint-disable-line no-console
      return ret;
    });

    // Freeze and render
    let rezHtml = theme.render(json.harden());

    // Turn logging back on
    turnoff.forEach((c, idx) => console[c] = org[idx]); // eslint-disable-line no-console

    // Unfreeze and apply Markdown
    return rezHtml = rezHtml.replace(/@@@@~[\s\S]*?~@@@@/g, val => MDIN( val.replace( /~@@@@/g,'' ).replace( /@@@@~/g,'' ) ));
  }
};


var MDIN = txt => // TODO: Move this
  MD(txt || '' ).replace(/^\s*<p>|<\/p>\s*$/gi, '')
;
