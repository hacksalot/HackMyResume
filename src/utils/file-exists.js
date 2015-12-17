/**
Definition of the `fileExists` method.
@license MIT. Copyright (c) 2015 James Devlin / FluentDesk.
@module file-exists.js
*/

var FS = require('fs');

// Yup, this is now the recommended way to check for file existence on Node.
// fs.exists is deprecated and the recommended fs.statSync/lstatSync throws
// exceptions on non-existent paths :)
module.exports = function (path) {
  try {
    FS.statSync( path );
    return true;
  } catch( err ) {
    return !(err && err.code === 'ENOENT');
  }
};
