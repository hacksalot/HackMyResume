/**
Definition of the HandlebarsGenerator class.
@license MIT. See LICENSE.md for details.
@module renderers/handlebars-generator
*/



(function() {



  var _ = require('underscore')
    , HANDLEBARS = require('handlebars')
    , FS = require('fs')
    , registerHelpers = require('../helpers/handlebars-helpers')
    , PATH = require('path')
    , parsePath = require('parse-filepath')
    , READFILES = require('recursive-readdir-sync')
    , HMSTATUS = require('../core/status-codes')
    , SLASH = require('slash');



  /**
  Perform template-based resume generation using Handlebars.js.
  @class HandlebarsGenerator
  */
  var HandlebarsGenerator = module.exports = {



    generateSimple: function( data, tpl ) {

      try {
        // Compile and run the Handlebars template.
        var template = HANDLEBARS.compile( tpl, { strict: false, assumeObjects: false } );
        return template( data );
      }
      catch( ex ) {
        throw {
          fluenterror: template ?
            HMSTATUS.invokeTemplate : HMSTATUS.compileTemplate,
          inner: ex
        };
      }

    },



    generate: function( json, jst, format, curFmt, opts, theme ) {

      // Set up partials and helpers
      registerPartials( format, theme );
      registerHelpers( theme, opts );

      // Preprocess text
      var encData = json;
      ( format === 'html' || format === 'pdf' ) && (encData = json.markdownify());
      ( format === 'doc' ) && (encData = json.xmlify());

      // Set up the context
      var ctx = {
        r: encData,
        RAW: json,
        filt: opts.filters,
        format: format,
        opts: opts,
        engine: this,
        results: curFmt.files,
        headFragment: opts.headFragment || ''
      };

      // Render the template
      return this.generateSimple( ctx, jst );
    }



  };



  function registerPartials(format, theme) {
    if( _.contains( ['html','doc','md','txt'], format )) {

      // Locate the global partials folder
      var partialsFolder = PATH.join(
        parsePath( require.resolve('fresh-themes') ).dirname,
        '/partials/',
        format
      );

      // Register global partials in the /partials/[format] folder
      // TODO: Only do this once per HMR invocation.
      _.each( READFILES( partialsFolder, function(error){ }), function( el ) {
        var pathInfo = parsePath( el );
        var name = SLASH( PATH.relative( partialsFolder, el )
          .replace(/\.(?:html|xml|hbs|md|txt)$/i, '') );
        var tplData = FS.readFileSync( el, 'utf8' );
        var compiledTemplate = HANDLEBARS.compile( tplData );
        HANDLEBARS.registerPartial( name, compiledTemplate );
        theme.partialsInitialized = true;
      });

    }

    // Register theme-specific partials
    _.each( theme.partials, function( el ) {
      var tplData = FS.readFileSync( el.path, 'utf8' );
      var compiledTemplate = HANDLEBARS.compile( tplData );
      HANDLEBARS.registerPartial( el.name, compiledTemplate );
    });
  }



}());
