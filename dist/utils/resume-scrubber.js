(function() {
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
    scrubResume: function(rep, opts) {
      var ignoreList, includePrivates, privateList, scrubbed, traverse;
      traverse = require('traverse');
      ignoreList = [];
      privateList = [];
      includePrivates = opts && opts["private"];
      scrubbed = traverse(rep).map(function() {
        if (!this.isLeaf) {
          if (this.node.ignore === true || this.node.ignore === 'true') {
            ignoreList.push(this.node);
            this["delete"]();
          } else if ((this.node["private"] === true || this.node["private"] === 'true') && !includePrivates) {
            privateList.push(this.node);
            this["delete"]();
          }
        }
        if (_.isArray(this.node)) {
          this.after(function() {
            this.update(_.compact(this.node));
          });
        }
      });
      return {
        scrubbed: scrubbed,
        ingoreList: ignoreList,
        privateList: privateList
      };
    }
  };

}).call(this);

//# sourceMappingURL=resume-scrubber.js.map
