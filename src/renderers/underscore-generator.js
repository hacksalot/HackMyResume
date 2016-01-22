/**
Definition of the UnderscoreGenerator class.
@license MIT. Copyright (c) 2015 James Devlin / FluentDesk.
@module underscore-generator.js
*/

(function() {



  var _ = require('underscore')
    , registerHelpers = require('../helpers/underscore-helpers')
    , HMSTATUS = require('../core/status-codes');


  /**
  Perform template-based resume generation using Underscore.js.
  @class UnderscoreGenerator
  */
  var UnderscoreGenerator = module.exports = {

    generateSimple: function( data, tpl ) {

      try {
        // Compile and run the Handlebars template.
        var template = _.template( tpl );
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

    generate: function( json, jst, format, cssInfo, opts, theme ) {

      // Tweak underscore's default template delimeters
      var delims = (opts.themeObj && opts.themeObj.delimeters) || opts.template;
      if( opts.themeObj && opts.themeObj.delimeters ) {
        delims = _.mapObject( delims, function(val,key) {
          return new RegExp( val, "ig");
        });
      }
      _.templateSettings = delims;

      // Strip {# comments #}
      jst = jst.replace( delims.comment, '');

      var ctx = {
        r: format === 'html' || format === 'pdf' || format === 'png' ? json.markdownify() : json,
        filt: opts.filters,
        XML: require('xml-escape'),
        RAW: json,
        cssInfo: cssInfo,
        //engine: this,
        headFragment: opts.headFragment || '',
        opts: opts
      };

      registerHelpers( theme, opts, cssInfo, ctx, this );

      return this.generateSimple( ctx, jst );
    }

  };



}());
