/**
HTML resume generator for FluentCV.
@license Copyright (c) 2015 James M. Devlin / FluentDesk
*/

(function() {

  var TemplateGenerator = require('./template-generator')
    , FS = require('fs-extra')
    , HTML = require( 'html' )
    , PATH = require('path');

  var HtmlGenerator = module.exports = TemplateGenerator.extend({

    init: function() {
      this._super( 'html' );
    },

    /**
    Copy satellite CSS files to the destination and optionally pretty-print
    the HTML resume prior to saving.
    */
    onBeforeSave: function( info ) {
      var cssSrc = PATH.join( info.theme.folder, 'src', '*.css' )
        , outFolder = PATH.parse( info.outputFile ).dir, that = this;

      info.theme.cssFiles.forEach( function( f ) {
        var fi = PATH.parse( f[1].path );
        FS.copySync( f[1].path, PATH.join( outFolder, fi.base ), { clobber: true }, function( e ) {
          throw { fluenterror: that.codes.copyCss, data: [cssSrc,cssDst] };
        });
      });

      return this.opts.prettify ?
        HTML.prettyPrint( info.mk, this.opts.prettify ) : info.mk;
    }

  });

}());
