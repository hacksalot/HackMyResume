/**
@module spawn-watch.js
*/

(function() {

// Catch various out-of-band child process errors such as ENOENT for PDFs
// http://stackoverflow.com/q/27688804
var SpawnWatcher = module.exports = function() {
  var childProcess = require("child_process");
  var oldSpawn = childProcess.spawn;
  childProcess.spawn = function() {
    return oldSpawn.apply(this, arguments)
      .on('error', function(err) {
        require('./error-handler').err( err, false );
      });
  };
}();

//SpawnWatcher();

}());
