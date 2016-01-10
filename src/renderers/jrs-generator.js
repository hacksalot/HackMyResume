/**
Definition of the JRSGenerator class.
@license MIT. See LICENSE.md for details.
@module jrs-generator.js
*/



(function() {



  var _ = require('underscore')
    , HANDLEBARS = require('handlebars')
    , FS = require('fs')
    , registerHelpers = require('../helpers/handlebars-helpers')
    , PATH = require('path')
    , parsePath = require('parse-filepath')
    , READFILES = require('recursive-readdir-sync')
    , SLASH = require('slash')
    , MD = require('marked');



  /**
  Perform template-based resume generation for JSON Resume themes.
  @class JRSGenerator
  */
  var JRSGenerator = module.exports = {




    generate: function( json, jst, format, cssInfo, opts, theme ) {

      // Disable JRS theme chatter (console.log, console.error, etc.)
      var off = ['log', 'error', 'dir'], org = off.map(function(c){
        var ret = console[c]; console[c] = function(){}; return ret;
      });

      // Freeze and render
      var rezHtml = theme.render( json.harden() );

      // Turn logging back on
      off.forEach(function(c, idx){ console[c] = org[idx]; });

      // Unfreeze and apply Markdown
      rezHtml = rezHtml.replace( /@@@@~.*?~@@@@/gm, function(val){
        return MDIN( val.replace( /~@@@@/gm,'' ).replace( /@@@@~/gm,'' ) );
      });

      return rezHtml;
    }


  };



  function MDIN(txt) { // TODO: Move this
    return MD(txt || '' ).replace(/^\s*<p>|<\/p>\s*$/gi, '');
  }


}());
