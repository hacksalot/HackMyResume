
/**
Keyword analysis for HackMyResume.
@license MIT. See LICENSE.md for details.
@module inspectors/keyword-inspector
 */

(function() {
  var FluentDate, _, keywordInspector;

  _ = require('underscore');

  FluentDate = require('../core/fluent-date');


  /**
  Analyze the resume's use of keywords.
  TODO: BUG: Keyword search regex is inaccurate, especially for one or two
  letter keywords like "C" or "CLI".
  @class keywordInspector
   */

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
      regex_quote = function(str) {
        return (str + '').replace(/[.?*+^$[\]\\(){}|-]/ig, "\\$&");
      };
      searchable = '';
      rez.transformStrings(['imp', 'computed', 'safe'], function(key, val) {
        return searchable += ' ' + val;
      });
      prefix = '(?:' + ['^', '\\s+', '[\\.,]+'].join('|') + ')';
      suffix = '(?:' + ['$', '\\s+', '[\\.,]+'].join('|') + ')';
      return rez.keywords().map(function(kw) {
        var count, myArray, regex, regex_str;
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
