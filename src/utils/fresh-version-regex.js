/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Defines a regex suitable for matching FRESH versions.
@module file-contains.js
*/

// Set up a regex that matches all of the following:
//
//   - FRESH
//   - JRS
//   - FRESCA
//   - FRESH@1.0.0
//   - FRESH@1.0
//   - FRESH@1
//   - JRS@0.16.0
//   - JRS@0.16
//   - JRS@0
//
// Don't use a SEMVER regex (eg, NPM's semver-regex) because a) we want to
// support partial semvers like "0" or "1.2" and b) we'll expand this later to
// support fully scoped FRESH versions.

module.exports = () => RegExp('^(FRESH|FRESCA|JRS)(?:@(\\d+(?:\\.\\d+)?(?:\\.\\d+)?))?$');
