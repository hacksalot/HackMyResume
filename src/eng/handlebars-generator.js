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


    initialized: false,

    init: function( format, theme ) {
      // TODO: Move .partialsInitialized to application state; shouldn't be on theme
      if( !theme.partialsInitialized ) {

        if( format !== 'html' && format != 'doc' )
          return;

        // Precompile global partials in the /partials folder
        var partialsFolder = PATH.join(
          parsePath( require.resolve('fresh-themes') ).dirname,
          '/partials/',
          format
        );

        _.each( READFILES( partialsFolder, function(error){ }), function( el ) {

          var pathInfo = parsePath( el );
          var name = SLASH( PATH.relative( partialsFolder, el )
            .replace(/\.html$|\.xml$/, '') );

          // section-employment, section-education, etc
          if( pathInfo.dirname.endsWith('section') ) {
            name = SLASH(name.replace(/\.html$|\.xml$/, ''));
          }
          else {

          }

          var tplData = FS.readFileSync( el, 'utf8' );
          var compiledTemplate = HANDLEBARS.compile( tplData );
          HANDLEBARS.registerPartial( name, compiledTemplate );
          theme.partialsInitialized = true;
        });
      }
    },



    generate: function( json, jst, format, cssInfo, opts, theme ) {

      this.init( format, theme );

      // Pre-compile any partials present in the theme.
      _.each( theme.partials, function( el ) {
        var tplData = FS.readFileSync( el.path, 'utf8' );
        var compiledTemplate = HANDLEBARS.compile( tplData );
        HANDLEBARS.registerPartial( el.name, compiledTemplate );
      });

      // Register necessary helpers.
      registerHelpers( theme );

      // Compile and run the Handlebars template.
      var template = HANDLEBARS.compile(jst);

      var encData = json;
      ( format === 'html' || format === 'pdf' ) && (encData = json.markdownify());
      ( format === 'doc' ) && (encData = json.xmlify());

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
}());
