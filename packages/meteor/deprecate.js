function cleanStackTrace(stackTrace) {
  if (!stackTrace || typeof stackTrace !== 'string') return [];
  var lines = stackTrace.split('\n');
  var trace = [];
  try {
    for (var i = 0; i < lines.length; i++) {
      var _line = lines[i].trim();
      if (_line.indexOf('Meteor.deprecate') !== -1) continue;
      if (_line.indexOf('packages/') !== -1) {
        trace.push(_line);
      } else if (_line && _line.indexOf('/') !== -1) {
        // Stop processing if a valid path that does not start with 'packages/**' is found
        trace.push(_line);
        break;
      }
    }
  } catch (e) {
    console.error('Error cleaning stack trace: ', e);
  }
  return trace.join('\n');
}

Meteor.deprecate = function () {
  if (!Meteor.isDevelopment) {
    return;
  }
  if (typeof console !== 'undefined' && typeof console.warn !== 'undefined') {
    var stackStrace = cleanStackTrace(new Error().stack || '');
    var messages = Array.prototype.slice.call(arguments); // Convert arguments to array

    if (stackStrace.length > 0) {
      messages.push('\n\n', 'Trace:', '\n', stackStrace);
    }

    console.warn.apply(console, ['[DEPRECATION]'].concat(messages));
  }
};
