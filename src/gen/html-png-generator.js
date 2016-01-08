/**
Definition of the HtmlPngGenerator class.
@license MIT. See LICENSE.MD for details.
@module html-png-generator.js
*/



(function() {



  var TemplateGenerator = require('./template-generator')
    , FS = require('fs-extra')
    , HTML = require( 'html' );



  /**
  An HTML-based PNG resume generator for HackMyResume.
  */
  var HtmlPngGenerator = module.exports = TemplateGenerator.extend({



    init: function() {
      this._super( 'png', 'html' );
    },



    invoke: function( rez, themeMarkup, cssInfo, opts ) {
      // TODO: Not currently called or callable.
    },



    generate: function( rez, f, opts ) {
      var htmlResults = opts.targets.filter(function(t){
        return t.fmt.outFormat === 'html';
      });
      var htmlFile = htmlResults[0].final.files.filter(function(fl){
        return fl.info.ext === 'html';
      });
      png( htmlFile[0].data, f );
    }



  });



  /**
  Generate a PNG from HTML.
  */
  function png( markup, fOut ) {
    // TODO: Which Webshot syntax?
    // require('webshot')( markup , { encoding: 'binary', siteType: 'html' } )
    //   .pipe( FS.createWriteStream( fOut ) );
    require('webshot')( markup , fOut, { siteType: 'html' }, function(err) { } );
  }



}());
