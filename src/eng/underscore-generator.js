/**
Definition of the UnderscoreGenerator class.
@license MIT. Copyright (c) 2015 James Devlin / FluentDesk.
@module underscore-generator.js
*/

(function() {



  var _ = require('underscore');



  /**
  Perform template-based resume generation using Underscore.js.
  @class UnderscoreGenerator
  */
  var UnderscoreGenerator = module.exports = {

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

      // Compile and run the template. TODO: avoid unnecessary recompiles.
      var compiled = _.template(jst);
      var ret = compiled({
        r: format === 'html' || format === 'pdf' || format === 'png' ? json.markdownify() : json,
        filt: opts.filters,
        XML: require('xml-escape'),
        RAW: json,
        cssInfo: cssInfo,
        headFragment: opts.headFragment || ''
      });
      return ret;
    }

  };

  

}());
