/**
Definition of the HTMLGenerator class.
@license MIT. Copyright (c) 2015 James Devlin / FluentDesk.
@module html-generator.js
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
      return this.opts.prettify ?
        HTML.prettyPrint( info.mk, this.opts.prettify ) : info.mk;
    }

  });

}());
