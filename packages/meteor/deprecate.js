if (Meteor.isServer && Meteor.isDevelopment) {
  if (typeof __meteor_runtime_config__ === 'object') {
    var noDeprecations = process.env.METEOR_NO_DEPRECATIONS;
    if (noDeprecations === 'true' || noDeprecations === 'false') {
      noDeprecations = noDeprecations === 'true';
    }
    __meteor_runtime_config__.noDeprecations = noDeprecations;
  }
}

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

    if (typeof __meteor_runtime_config__.noDeprecations === 'string') {
      const noDeprecationPattern = new RegExp(__meteor_runtime_config__.noDeprecations);
      if (noDeprecationPattern.test(stackStrace)) {
        return;
      }
    } else if (typeof __meteor_runtime_config__.noDeprecations === 'boolean' && __meteor_runtime_config__.noDeprecations) {
      return;
    }
    if (stackStrace.length > 0) {
      messages.push('\n\n', 'Trace:', '\n', stackStrace);
    }

    console.warn.apply(console, ['[DEPRECATION]'].concat(messages));
  }
};
