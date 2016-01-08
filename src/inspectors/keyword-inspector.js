/**
Keyword analysis for HackMyResume.
@license MIT. See LICENSE.md for details.
@module keyword-inspector.js
*/



(function() {



  var _ = require('underscore');
  var FluentDate = require('../core/fluent-date');



  /**
  Analyze the resume's use of keywords.
  @class keywordInspector
  */
  var keywordInspector = module.exports = {



    /**
    A unique name for this inspector.
    */
    moniker: 'keyword-inspector',



    /**
    Run the Keyword Inspector on a resume.
    @method run
    @return An collection of statistical keyword data.
    */
    run: function( rez ) {

      // http://stackoverflow.com/a/2593661/4942583
      function regex_quote(str) {
        return (str + '').replace(/[.?*+^$[\]\\(){}|-]/ig, "\\$&");
      }

      var searchable = '';
      rez.transformStrings( ['imp', 'computed', 'safe'], function trxString( key, val ) {
        searchable += ' ' + val;
      });

      return rez.keywords().map(function(kw) {
        //var regex = new RegExp( '\\b' + regex_quote( kw )/* + '\\b'*/, 'ig');
        var regex = new RegExp( regex_quote( kw ), 'ig');
        var myArray, count = 0;
        while ((myArray = regex.exec( searchable )) !== null) {
          count++;
        }
        return {
          name: kw,
          count: count
        };

      });
    }



  };



}());
