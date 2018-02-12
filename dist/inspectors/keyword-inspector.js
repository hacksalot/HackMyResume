(function() {
  /**
  Keyword analysis for HackMyResume.
  @license MIT. See LICENSE.md for details.
  @module inspectors/keyword-inspector
  */
  /**
  Analyze the resume's use of keywords.
  TODO: BUG: Keyword search regex is inaccurate, especially for one or two
  letter keywords like "C" or "CLI".
  @class keywordInspector
  */
  var FluentDate, _, keywordInspector;

  _ = require('underscore');

  FluentDate = require('../core/fluent-date');

  keywordInspector = module.exports = {
    /** A unique name for this inspector. */
    moniker: 'keyword-inspector',
    /**
    Run the Keyword Inspector on a resume.
    @method run
    @return An collection of statistical keyword data.
    */
    run: function(rez) {
      var prefix, regex_quote, searchable, suffix;
      // "Quote" or safely escape a keyword so it can be used as a regex. For
      // example, if the keyword is "C++", yield "C\+\+".
      // http://stackoverflow.com/a/2593661/4942583
      regex_quote = function(str) {
        return (str + '').replace(/[.?*+^$[\]\\(){}|-]/ig, "\\$&");
      };
      // Create a searchable plain-text digest of the resume
      // TODO: BUG: Don't search within keywords for other keywords. Job A
      // declares the "foo" keyword. Job B declares the "foo & bar" keyword. Job
      // B's mention of "foobar" should not count as a mention of "foo".
      // To achieve this, remove keywords from the search digest and treat them
      // separately.
      searchable = '';
      rez.transformStrings(['imp', 'computed', 'safe'], function(key, val) {
        return searchable += ' ' + val;
      });
      // Assemble a regex skeleton we can use to test for keywords with a bit
      // more
      prefix = '(?:' + ['^', '\\s+', '[\\.,]+'].join('|') + ')';
      suffix = '(?:' + ['$', '\\s+', '[\\.,]+'].join('|') + ')';
      return rez.keywords().map(function(kw) {
        var count, myArray, regex, regex_str;
        // 1. Using word boundary or other regex class is inaccurate

        //    var regex = new RegExp( '\\b' + regex_quote( kw )/* + '\\b'*/, 'ig');

        // 2. Searching for the raw keyword is inaccurate ("C" will match any
        // word containing a 'c'!).

        //    var regex = new RegExp( regex_quote( kw ), 'ig');

        // 3. Instead, use a custom regex with special delimeters.
        regex_str = prefix + regex_quote(kw) + suffix;
        regex = new RegExp(regex_str, 'ig');
        myArray = null;
        count = 0;
        while ((myArray = regex.exec(searchable)) !== null) {
          count++;
        }
        return {
          name: kw,
          count: count
        };
      });
    }
  };

}).call(this);

//# sourceMappingURL=keyword-inspector.js.map
