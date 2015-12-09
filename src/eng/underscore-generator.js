/**
Underscore template generate for FluentCV.
@license MIT. Copyright (c) 2015 James M. Devlin / FluentDesk.
*/

(function() {

  var _ = require('underscore');

  module.exports = function( json, jst, format, cssInfo, opts ) {

    // Tweak underscore's default template delimeters
    var delims = opts.themeObj.delimeters || opts.template;
    if( opts.themeObj.delimeters ) {
      delims = _.mapObject( delims, function(val,key) {
        return new RegExp( val, "ig")
      });
    }
    _.templateSettings = delims;

    // Strip {# comments #}
    jst = jst.replace( delims.comment, '');
    // Compile and run the template. TODO: avoid unnecessary recompiles.
    var compiled = _.template(jst);
    var ret = compiled({
      r: format === 'html' || format === 'pdf' ? json.markdownify() : json,
      filt: opts.filters,
      XML: require('xml-escape'),
      RAW: json,
      cssInfo: cssInfo,
      headFragment: opts.headFragment || ''
    });
    return ret;

  };

}());
