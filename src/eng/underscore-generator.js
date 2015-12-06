/**
Underscore template generate for FluentCV.
@license MIT. Copyright (c) 2015 James M. Devlin / FluentDesk.
*/

(function() {

  var _ = require('underscore');

  module.exports = function( json, jst, format, cssInfo, opts ) {

    // Tweak underscore's default template delimeters
    _.templateSettings = opts.template;

    // Convert {{ someVar }} to {% print(filt.out(someVar) %}
    // Convert {{ someVar|someFilter }} to {% print(filt.someFilter(someVar) %}
    jst = jst.replace( _.templateSettings.interpolate, function replace(m, p1) {
      if( p1.indexOf('|') > -1 ) {
        var terms = p1.split('|');
        return '{% print( filt.' + terms[1] + '( ' + terms[0] + ' )) %}';
      }
      else {
        return '{% print( filt.out(' + p1 + ') ) %}';
      }
    });

    // Strip {# comments #}
    jst = jst.replace( _.templateSettings.comment, '');

    // Compile and run the template. TODO: avoid unnecessary recompiles.
    jst = _.template(jst)({ r: json, filt: opts.filters, cssInfo: cssInfo, headFragment: opts.headFragment || '' });

    return jst;

  };

}());
