/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Definition of the HandlebarsGenerator class.
@license MIT. See LICENSE.md for details.
@module renderers/handlebars-generator
*/


const _ = require('underscore');
const HANDLEBARS = require('handlebars');
const FS = require('fs');
const registerHelpers = require('../helpers/handlebars-helpers');
const PATH = require('path');
const parsePath = require('parse-filepath');
const READFILES = require('recursive-readdir-sync');
const HMSTATUS = require('../core/status-codes');
const SLASH = require('slash');



/**
Perform template-based resume generation using Handlebars.js.
@class HandlebarsGenerator
*/
module.exports = {



  generateSimple( data, tpl ) {

    let template;
    try {
      // Compile and run the Handlebars template.
      template = HANDLEBARS.compile(tpl, {
        strict: false,
        assumeObjects: false,
        noEscape: data.opts.noescape
      }
      );
      return template(data);
    } catch (err) {
      throw{
        fluenterror:
          HMSTATUS[ template ? 'invokeTemplate' : 'compileTemplate' ],
        inner: err
      };
    }
  },



  generate( json, jst, format, curFmt, opts, theme ) {

    // Preprocess text
    let encData = json;
    if ((format === 'html') || (format === 'pdf')) {
      encData = json.markdownify();
    }
    if( format === 'doc' ) {
      encData = json.xmlify();
    }

    // Set up partials and helpers
    registerPartials(format, theme);
    registerHelpers(theme, encData, opts);

    // Set up the context
    const ctx = {
      r: encData,
      RAW: json,
      filt: opts.filters,
      format,
      opts,
      engine: this,
      results: curFmt.files,
      headFragment: opts.headFragment || ''
    };

    // Render the template
    return this.generateSimple(ctx, jst);
  }
};



var registerPartials = function(format, theme) {

  if (_.contains( ['html','doc','md','txt','pdf'], format )) {

    // Locate the global partials folder
    const partialsFolder = PATH.join(
      parsePath( require.resolve('fresh-themes') ).dirname,
      '/partials/',
      format === 'pdf' ? 'html' : format
    );

    // Register global partials in the /partials/[format] folder
    // TODO: Only do this once per HMR invocation.
    _.each(READFILES( partialsFolder ), function( el ) {
      const name = SLASH(PATH.relative( partialsFolder, el ).replace(/\.(?:html|xml|hbs|md|txt)$/i, ''));
      const tplData = FS.readFileSync(el, 'utf8');
      const compiledTemplate = HANDLEBARS.compile(tplData);
      HANDLEBARS.registerPartial(name, compiledTemplate);
      return theme.partialsInitialized = true;
    });
  }

  // Register theme-specific partials
  return _.each(theme.partials, function( el ) {
    const tplData = FS.readFileSync(el.path, 'utf8');
    const compiledTemplate = HANDLEBARS.compile(tplData);
    return HANDLEBARS.registerPartial(el.name, compiledTemplate);
  });
};
