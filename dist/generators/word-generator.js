
/*
Definition of the WordGenerator class.
@module generators/word-generator
@license MIT. See LICENSE.md for details.
 */

(function() {
  var TemplateGenerator, WordGenerator,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  TemplateGenerator = require('./template-generator');

  module.exports = WordGenerator = (function(superClass) {
    extend(WordGenerator, superClass);

    function WordGenerator() {
      WordGenerator.__super__.constructor.call(this, 'doc', 'xml');
    }

    return WordGenerator;

  })(TemplateGenerator);

}).call(this);

//# sourceMappingURL=word-generator.js.map
