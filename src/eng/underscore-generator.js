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

    // Convert {{ someVar }} to {% print(filt.out(someVar) %}
    // Convert {{ someVar|someFilter }} to {% print(filt.someFilter(someVar) %}
    jst = jst.replace( delims.interpolate, function replace(m, p1) {
      if( p1.indexOf('|') > -1 ) {
        var terms = p1.split('|');
        return '[~ print( filt.' + terms[1] + '( ' + terms[0] + ' )) ]]';
      }
      else {
        return '[~ print( filt.out(' + p1 + ') ) ]]';
      }
    });

    // Strip {# comments #}
    jst = jst.replace( delims.comment, '');
    // Compile and run the template. TODO: avoid unnecessary recompiles.
    var compiled = _.template(jst);
    var ret = compiled({
      r: json,
      filt: opts.filters,
      cssInfo: cssInfo,
      headFragment: opts.headFragment || ''
    });
    return ret;

  };

}());
