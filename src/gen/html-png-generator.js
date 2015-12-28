/**
Definition of the HtmlPngGenerator class.
@license MIT. Copyright (c) 2015 James Devlin / FluentDesk.
@module html-png-generator.js
*/

(function() {

  var TemplateGenerator = require('./template-generator')
    , FS = require('fs-extra')
    , HTML = require( 'html' );

  /**
  An HTML-based PDF resume generator for HackMyResume.
  */
  var HtmlPngGenerator = module.exports = TemplateGenerator.extend({

    init: function() {
console.log('png generator init');
      this._super( 'png', 'html' );
    },

    /**
    Generate the binary PDF.
    */
    onBeforeSave: function( info ) {
console.log('png generator onBeforeSave');
      png( info.mk, info.outputFile );
      return null; // halt further processing
    }

  });

  /**
  Generate a PDF from HTML.
  */
  function png( markup, fOut ) {

    console.log('>> #png()');
    console.log(markup);
    console.log(fOut);

    require('webshot')( markup , { encoding: 'binary', siteType: 'html' } )
      .pipe( FS.createWriteStream( fOut ) );

  }

}());
