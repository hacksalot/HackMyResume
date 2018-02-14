/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Definition of the ResumeDetector class.
@module utils/resume-detector
@license MIT. See LICENSE.md for details.
*/

module.exports = function( rez ) {
  if (rez.meta && rez.meta.format) { //&& rez.meta.format.substr(0, 5).toUpperCase() == 'FRESH'
    return 'fresh';
  } else if (rez.basics) {
    return 'jrs';
  } else {
    return 'unk';
  }
};
