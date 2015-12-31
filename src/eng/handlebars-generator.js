/**
Definition of the HandlebarsGenerator class.
@license MIT. Copyright (c) 2015 James Devlin / FluentDesk.
@module handlebars-generator.js
*/

(function() {



  var _ = require('underscore')
    , HANDLEBARS = require('handlebars')
    , FS = require('fs')
    , registerHelpers = require('./handlebars-helpers');



  /**
  Perform template-based resume generation using Handlebars.js.
  @class HandlebarsGenerator
  */
  var HandlebarsGenerator = module.exports = {

    generate: function( json, jst, format, cssInfo, opts, theme ) {

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
      return template({
        r: format === 'html' || format === 'pdf' || format === 'png' ? json.markdownify() : json,
        RAW: json,
        filt: opts.filters,
        cssInfo: cssInfo,
        opts: opts,
        headFragment: opts.headFragment || ''
      });

    }

  };

}());
