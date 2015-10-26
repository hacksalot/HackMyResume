/**
HTML resume generator for FluentCV.
@license Copyright (c) 2015 by James M. Devlin. All rights reserved.
*/

var TemplateGenerator = require('./template-generator');
var FS = require('fs-extra');
var HTML = require( 'html' );

var HtmlGenerator = module.exports = TemplateGenerator.extend({

  init: function() {
    this._super( 'html' );
  },

  /**
  Generate an HTML resume with optional pretty printing.
  */
  onBeforeSave: function( mk, theme, outputFile ) {
    var themeFile = theme.getFormat('html').path;
    var cssSrc = themeFile.replace( /.html$/g, '.css' );
    var cssDst = outputFile.replace( /.html$/g, '.css' );
    var that = this;
    FS.copySync( cssSrc, cssDst, { clobber: true }, function( e ) {
      throw { fluenterror: that.codes.copyCss, data: [cssSrc,cssDst] };
    });

    return this.opts.prettify ?
      HTML.prettyPrint( mk, this.opts.prettify ) : mk;
  }

});
