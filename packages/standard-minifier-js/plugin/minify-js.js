import { extractModuleSizesTree } from "./stats.js";
import CombinedFile from "./comibinedFile.js";

function getConfig() {
  // read the meteor project pakcgae.json file
  const packageJson = fs.readFileSync(`${getMeteorAppDir()}/package.json`, 'utf8');
  const meteorConfig = JSON.parse(packageJson).meteor;
  return meteorConfig;
};

const statsEnabled = process.env.DISABLE_CLIENT_STATS !== 'true'

if (typeof Profile === 'undefined') {
  if (Plugin.Profile) {
    Profile = Plugin.Profile;
  } else {
    Profile = function (label, func) {
      return function () {
        return func.apply(this, arguments);
      }
    }
    Profile.time = function (label, func) {
      func();
    }
  }
}

let swc;

Plugin.registerMinifier({
    extensions: ['js'],
    archMatching: 'web',
  },
  () => new MeteorMinifier()
);

class MeteorMinifier {

  constructor() {
    this.config = getConfig();
  }

  _minifyWithSWC(file) {
    swc = swc || require('@meteorjs/swc-core'); 
    const NODE_ENV = process.env.NODE_ENV || 'development';
    
    let map = file.getSourceMap();
    let content = file.getContentsAsString();

    if (map) {
      map = JSON.stringify(map);
    }

    return swc.minifySync(
      content,
      {
        ecma: 5,
        compress: {
          drop_debugger: false,

          unused: true,
          dead_code: true,
          typeofs: false,

          global_defs: {
            'process.env.NODE_ENV': NODE_ENV,
          },
        },
        sourceMap: map ? {
          content: map,
        } : undefined,
        safari10: true,
        inlineSourcesContent: true
      }
    );
  }

  _minifyWithTerser(file) {
    let terser = require('terser');
    const NODE_ENV = process.env.NODE_ENV || 'development';

    return terser.minify(file.getContentsAsString(), {
      compress: {
        drop_debugger: false,
        unused: false,
        dead_code: true,
        global_defs: {
          "process.env.NODE_ENV": NODE_ENV
        }
      },
      // Fix issue meteor/meteor#9866, as explained in this comment:
      // https://github.com/mishoo/UglifyJS2/issues/1753#issuecomment-324814782
      // And fix terser issue #117: https://github.com/terser-js/terser/issues/117
      safari10: true,
      sourceMap: {
        content: file.getSourceMap()
      }
    });
  }

  minifyOneFile(file) {
    // TODO: create a function to check if the file should be skipped and share it with babel-compiler.js file
    if(this.config.modernTranspiler) return this._minifyWithTerser(file).await();
    // TODO: read the pkg.json file from the meteor project and ceck the swc build option
    // TODO: add a flag to the minifier to use swc or terser inside the meteor project package.json
    try {
      return this._minifyWithSWC(file);
    } catch (swcError) {
      try {
        // swc always parses as if the file is a module, which is
        // too strict for some Meteor packages. Try again with terser
        return this._minifyWithTerser(file).await();
      } catch (_) {
        // swc has a much better error message, so we use it
        throw swcError;
      }
    }
  }
}

MeteorMinifier.prototype.processFilesForBundle = Profile('processFilesForBundle', function (files, options) {
  const mode = options.minifyMode;

  // don't minify anything for development
  if (mode === 'development') {
    files.forEach(function (file) {
      file.addJavaScript({
        data: file.getContentsAsBuffer(),
        sourceMap: file.getSourceMap(),
        path: file.getPathInBundle(),
      });
    });
    return;
  }

  // this object will collect all the minified code in the
  // data field and post-minfiication file sizes in the stats field
  const toBeAdded = {
    data: "",
    stats: Object.create(null)
  };
  const minifiedResults = [];

  var combinedFile = new CombinedFile();
  for  (let file of files) {
    if(file instanceof Promise ) file = file.await();
    // Don't reminify *.min.js.
    if (/\.min\.js$/.test(file.getPathInBundle())) {
      minifiedResults.push({
        code: file.getContentsAsString(),
        map: file.getSourceMap()
      });
      Plugin.nudge();
      continue;
    }
 
    let minified;
    let label = 'minify file'
    if (file.getPathInBundle() === 'app/app.js') {
      label = 'minify app/app.js'
    }
    if (file.getPathInBundle() === 'packages/modules.js') {
      label = 'minify packages/modules.js'
    }


    try {
      Profile.time(label, () => {
        minified = this.minifyOneFile(file);
      });

      if (!(minified && typeof minified.code === "string")) {
        throw new Error();
      }

    }
    catch (err) {
      var filePath = file.getPathInBundle();

      err.message += " while minifying " + filePath;
      throw err;
    }

    if (statsEnabled) {
      let tree;
      Profile.time('extractModuleSizesTree', () => {
        tree = extractModuleSizesTree(minified.code);
        if (tree) {
          toBeAdded.stats[file.getPathInBundle()] =
            [Buffer.byteLength(minified.code), tree];
        } else {
          toBeAdded.stats[file.getPathInBundle()] =
            Buffer.byteLength(minified.code);
        }
      });
    }

    minifiedResults.push({
      file: file.getPathInBundle(),
      code: minified.code,
      map: minified.map
    });
    
    Plugin.nudge();
  }

  let output;
  Profile.time('concat', () => {
    minifiedResults.forEach(function (result, index) {
      if (index > 0) {
        combinedFile.addGeneratedCode('\n\n');
      }

      let map = result.map;

      if (typeof map === 'string') {
        map = JSON.parse(result.map);
      }

      combinedFile.addCodeWithMap(result.file, { code: result.code, map });

      Plugin.nudge();
    });

    output = combinedFile.build();
  });

  if (files.length) {
    Profile.time('addJavaScript', () => {
      toBeAdded.data = output.code;
      toBeAdded.sourceMap = output.map;
      files[0].addJavaScript(toBeAdded);
    });
  }
});
