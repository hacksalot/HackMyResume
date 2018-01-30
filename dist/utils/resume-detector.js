
/**
Definition of the ResumeDetector class.
@module utils/resume-detector
@license MIT. See LICENSE.md for details.
 */

(function() {
  module.exports = function(rez) {
    if (rez.meta && rez.meta.format) {
      return 'fresh';
    } else if (rez.basics) {
      return 'jrs';
    } else {
      return 'unk';
    }
  };

}).call(this);

//# sourceMappingURL=resume-detector.js.map
