/**
MS Word resume generator for FluentCV.
@license Copyright (c) 2015 by James M. Devlin. All rights reserved.
*/

(function() {

  var TemplateGenerator = require('./template-generator');
  var WordGenerator = module.exports = TemplateGenerator.extend({

    init: function(){
      this._super( 'doc', 'xml' );
    }

  });


}());
