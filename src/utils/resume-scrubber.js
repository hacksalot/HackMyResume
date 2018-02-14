/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const _ = require('underscore');

module.exports = {

  /**
  Removes ignored or private fields from a resume object
  @returns an object with the following structure:
  {
    scrubbed: the processed resume object
    ignoreList: an array of ignored nodes that were removed
    privateList: an array of private nodes that were removed
  }
  */
  scrubResume(rep, opts) {
    const traverse = require('traverse');
    const ignoreList = [];
    const privateList = [];
    const includePrivates = opts && opts.private;

    const scrubbed = traverse( rep ).map(function() { // [^1]
      if (!this.isLeaf) {
        if ((this.node.ignore === true) || (this.node.ignore === 'true')) {
          ignoreList.push(this.node);
          this.delete();
        } else if (((this.node.private === true) || (this.node.private === 'true')) && !includePrivates) {
          privateList.push(this.node);
          this.delete();
        }
      }
      if (_.isArray(this.node)) { // [^2]
        this.after(function() {
          this.update(_.compact(this.node));
        });
      }
    });

    return {
      scrubbed,
      ingoreList: ignoreList,
      privateList
    };
  }
};



// [^1]: As of v0.6.6, the NPM traverse library has a quirk when attempting
// to remove array elements directly using traverse's `this.remove`. See:
//
// https://github.com/substack/js-traverse/issues/48
//
// [^2]: The workaround is to use traverse's 'this.delete' to nullify the value
// first, followed by removal with something like _.compact.
//
// https://github.com/substack/js-traverse/issues/48#issuecomment-142607200
//
