/**
Definition of the HandlebarsGenerator class.
@license MIT. See LICENSE.md for details.
@module handlebars-generator.js
*/



(function() {



  var _ = require('underscore')
    , HANDLEBARS = require('handlebars')
    , FS = require('fs')
    , registerHelpers = require('./handlebars-helpers')
    , PATH = require('path')
    , parsePath = require('parse-filepath')
    , READFILES = require('recursive-readdir-sync')
    , SLASH = require('slash');



  /**
  Perform template-based resume generation using Handlebars.js.
  @class HandlebarsGenerator
  */
  var HandlebarsGenerator = module.exports = {




    generate: function( json, jst, format, cssInfo, opts, theme ) {

      registerPartials( format, theme );
      registerHelpers( theme );

      // Preprocess text
      var encData = json;
      ( format === 'html' || format === 'pdf' ) && (encData = json.markdownify());
      ( format === 'doc' ) && (encData = json.xmlify());

      // Compile and run the Handlebars template.
      var template = HANDLEBARS.compile(jst);
      return template({
        r: encData,
        RAW: json,
        filt: opts.filters,
        cssInfo: cssInfo,
        format: format,
        opts: opts,
        headFragment: opts.headFragment || ''
      });

    }



  };



  function registerPartials(format, theme) {
    if( format !== 'html' && format != 'doc' )
      return;

    // Locate the global partials folder
    var partialsFolder = PATH.join(
      parsePath( require.resolve('fresh-themes') ).dirname,
      '/partials/',
      format
    );

    // Register global partials in the /partials folder
    // TODO: Only do this once per HMR invocation.
    _.each( READFILES( partialsFolder, function(error){ }), function( el ) {
      var pathInfo = parsePath( el );
      var name = SLASH( PATH.relative( partialsFolder, el )
        .replace(/\.html$|\.xml$/, '') );
      if( pathInfo.dirname.endsWith('section') ) {
        name = SLASH(name.replace(/\.html$|\.xml$/, ''));
      }
      var tplData = FS.readFileSync( el, 'utf8' );
      var compiledTemplate = HANDLEBARS.compile( tplData );
      HANDLEBARS.registerPartial( name, compiledTemplate );
      theme.partialsInitialized = true;
    });

    // Register theme-specific partials
    _.each( theme.partials, function( el ) {
      var tplData = FS.readFileSync( el.path, 'utf8' );
      var compiledTemplate = HANDLEBARS.compile( tplData );
      HANDLEBARS.registerPartial( el.name, compiledTemplate );
    });
  }



}());
