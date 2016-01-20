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
  TODO: BUG: Keyword search regex is inaccurate, especially for one or two
  letter keywords like "C" or "CLI".
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

      // "Quote" or safely escape a keyword so it can be used as a regex. For
      // example, if the keyword is "C++", yield "C\+\+".
      // http://stackoverflow.com/a/2593661/4942583
      function regex_quote(str) {
        return (str + '').replace(/[.?*+^$[\]\\(){}|-]/ig, "\\$&");
      }

      // Create a searchable plain-text digest of the resume
      // TODO: BUG: Don't search within keywords for other keywords. Job A
      // declares the "foo" keyword. Job B declares the "foo & bar" keyword. Job
      // B's mention of "foobar" should not count as a mention of "foo".
      // To achieve this, remove keywords from the search digest and treat them
      // separately.
      var searchable = '';
      rez.transformStrings( ['imp', 'computed', 'safe'], function trxString( key, val ) {
        searchable += ' ' + val;
      });

      // Assemble a regex skeleton we can use to test for keywords with a bit
      // more 
      var prefix = '(?:' + ['^', '\\s+', '[\\.,]+'].join('|') + ')';
      var suffix = '(?:' + ['$', '\\s+', '[\\.,]+'].join('|') + ')';

      return rez.keywords().map(function(kw) {

        // 1. Using word boundary or other regex class is inaccurate
        //
        //    var regex = new RegExp( '\\b' + regex_quote( kw )/* + '\\b'*/, 'ig');
        //
        // 2. Searching for the raw keyword is inaccurate ("C" will match any
        // word containing a 'c'!).
        //
        //    var regex = new RegExp( regex_quote( kw ), 'ig');
        //
        // 3. Instead, use a custom regex with special delimeters.

        var regex_str = prefix + regex_quote( kw ) + suffix;
        var regex = new RegExp( regex_str, 'ig');
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
