module.exports =

  ###*
  Removes ignored or private fields from a resume object
  @returns an object with the following structure:
  {
    scrubbed: the processed resume object
    ignoreList: an array of ignored nodes that were removed
    privateList: an array of private nodes that were removed
  }
  ###
  scrubResume: (rep, opts) ->
    traverse = require 'traverse'
    ignoreList = []
    privateList = []
    includePrivates = opts && opts.private

    scrubbed = traverse( rep ).map () -> # [^1]
      if !@isLeaf
        if @node.ignore == true || @node.ignore == 'true'
          ignoreList.push @node
          @delete()
        else if (@node.private == true || @node.private == 'true') && !includePrivates
          privateList.push @node
          @delete()
      if _.isArray(@node) # [^2]
        @after () ->
          @update _.compact this.node
          return
      return

    scrubbed: scrubbed
    ingoreList: ignoreList
    privateList: privateList



# [^1]: As of v0.6.6, the NPM traverse library has a quirk when attempting
# to remove array elements directly using traverse's `this.remove`. See:
#
# https://github.com/substack/js-traverse/issues/48
#
# [^2]: The workaround is to use traverse's 'this.delete' to nullify the value
# first, followed by removal with something like _.compact.
#
# https://github.com/substack/js-traverse/issues/48#issuecomment-142607200
#
