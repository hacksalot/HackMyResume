###*
Definition of the ResumeDetector class.
@module utils/resume-detector
@license MIT. See LICENSE.md for details.
###

module.exports = ( rez ) ->
  if rez.meta && rez.meta.format #&& rez.meta.format.substr(0, 5).toUpperCase() == 'FRESH'
    'fresh'
  else if rez.basics
    'jrs'
  else
    'unk'
