###*
Message-handling routines for HackMyResume.
@module cli/msg
@license MIT. See LICENSE.md for details.
###


PATH = require 'path'
YAML = require 'yamljs'
module.exports = YAML.load PATH.join __dirname, 'msg.yml'
