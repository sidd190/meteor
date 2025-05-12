var selftest = require('../tool-testing/selftest.js');
var Sandbox = selftest.Sandbox;
var files = require('../fs/files');

// No need for a high value since the asserts already wait long enough to pass tests
const waitToStart = 5;

async function writeModernConfig(s, modernConfig) {
  const json = JSON.parse(s.read("package.json"));

  json.meteor = {
    ...json.meteor,
    modern: modernConfig,
  };

  s.write("package.json", JSON.stringify(json, null, 2) + "\n");

}

selftest.define("modern build stack - legacy", async function () {
  const currentMeteorModern = process.env.METEOR_MODERN;
  process.env.METEOR_MODERN = 'false';

  const s = new Sandbox();
  await s.init();

  await s.createApp("modern", "modern");
  await s.cd("modern");

  s.set("METEOR_PROFILE", "0");

  await writeModernConfig(s, false);

  const run = s.run();

  run.waitSecs(waitToStart);
  await run.match("App running at");

  /* check legacy stack */
  await run.match(/Babel\.compile/, false, true);
  await run.match(/safeWatcher\.watchLegacy/, false, true);
  await run.match(/_findSources for web\.browser.legacy/, false, true);

  /* check debug stack */
  await run.match(/server\/main\.js:6:22/, false, true);

  await run.stop();

  process.env.METEOR_MODERN = currentMeteorModern;
});

selftest.define("modern build stack", async function () {
  const currentMeteorModern = process.env.METEOR_MODERN;
  process.env.METEOR_MODERN = '';

  const s = new Sandbox();
  await s.init();

  await s.createApp("modern", "modern");
  await s.cd("modern");

  s.set("METEOR_PROFILE", "0");
  
  await writeModernConfig(s, true);

  const run = s.run();

  run.waitSecs(waitToStart);
  await run.match("App running at");

  /* check modern stack */
  await run.match(/SWC\.compile/, false, true);
  await run.match(/safeWatcher\.watchModern/, false, true);
  await run.match(/_findSources for web\.browser/, false, true);

  run.forbid(/Babel\.compile/, false, true);
  run.forbid(/_findSources for web\.browser\.legacy/, false, true);

  /* check debug stack */
  await run.match(/server\/main\.js:6:22/, false, true);

  await run.stop();

  process.env.METEOR_MODERN = currentMeteorModern;
});

selftest.define("modern build stack - disable transpiler", async function () {
  const currentMeteorModern = process.env.METEOR_MODERN;
  process.env.METEOR_MODERN = '';

  const s = new Sandbox();
  await s.init();

  await s.createApp("modern", "modern");
  await s.cd("modern");

  s.set("METEOR_PROFILE", "0");

  await writeModernConfig(s, { transpiler: false });

  const run = s.run();

  run.waitSecs(waitToStart);
  await run.match("App running at");

  /* disable transpiler */
  run.forbid(/SWC\.compile/, false, true);
  await run.match(/Babel\.compile/, false, true);

  /* Keep rest of modern build stack */
  await run.match(/safeWatcher\.watchModern/, false, true);
  await run.match(/_findSources for web\.browser/, false, true);
  run.forbid(/_findSources for web\.browser\.legacy/, false, true);

  await run.stop();

  process.env.METEOR_MODERN = currentMeteorModern;
});

selftest.define("modern build stack - disable watcher", async function () {
  const currentMeteorModern = process.env.METEOR_MODERN;
  process.env.METEOR_MODERN = '';

  const s = new Sandbox();
  await s.init();

  await s.createApp("modern", "modern");
  await s.cd("modern");

  s.set("METEOR_PROFILE", "0");

  await writeModernConfig(s, { watcher: false });

  const run = s.run();

  run.waitSecs(waitToStart);
  await run.match("App running at");

  /* disable watcher */
  run.forbid(/safeWatcher\.watchModern/, false, true);
  await run.match(/safeWatcher\.watchLegacy/, false, true);

  /* Keep rest of modern build stack */
  await run.match(/SWC\.compile/, false, true);
  await run.match(/_findSources for web\.browser/, false, true);
  run.forbid(/_findSources for web\.browser\.legacy/, false, true);

  await run.stop();

  process.env.METEOR_MODERN = currentMeteorModern;
});

selftest.define("modern build stack - disable webArchOnly", async function () {
  const currentMeteorModern = process.env.METEOR_MODERN;
  process.env.METEOR_MODERN = '';

  const s = new Sandbox();
  await s.init();

  await s.createApp("modern", "modern");
  await s.cd("modern");

  s.set("METEOR_PROFILE", "0");

  await writeModernConfig(s, { webArchOnly: false });

  const run = s.run();

  run.waitSecs(waitToStart);
  await run.match("App running at");

  /* disable webArchOnly */
  await run.match(/_findSources for web\.browser/, false, true);
  await run.match(/_findSources for web\.browser\.legacy/, false, true);

  /* Keep rest of modern build stack */
  await run.match(/safeWatcher\.watchModern/, false, true);
  await run.match(/SWC\.compile/, false, true);

  await run.stop();

  process.env.METEOR_MODERN = currentMeteorModern;
});

selftest.define("modern build stack - transpiler boolean-like options", async function () {
  const currentMeteorModern = process.env.METEOR_MODERN;
  process.env.METEOR_MODERN = '';

  const s = new Sandbox();
  await s.init();

  await s.createApp("modern", "modern");
  await s.cd("modern");

  process.env.METEOR_DISABLE_COLORS = true;

  await writeModernConfig(s, {
    transpiler: {
      verbose: true,
    },
  });

  const run = s.run();

  run.waitSecs(waitToStart);
  await run.match("App running at");

  /* check transpiler options */
  await run.match(/\[Transpiler] Used SWC.*\(app\)/, false, true);
  await run.match(/\[Transpiler] Used SWC.*\(package\)/, false, true);

  await writeModernConfig(s, {
    transpiler: {
      verbose: true,
      excludeApp: true,
    },
  });
  await run.match(/\[Transpiler] Used Babel.*\(app\)/, false, true);

  await writeModernConfig(s, {
    transpiler: {
      verbose: true,
      excludePackages: true,
    },
  });
  await run.match(/\[Transpiler] Used Babel.*\(package\)/, false, true);

  await run.stop();

  process.env.METEOR_MODERN = currentMeteorModern;
});

selftest.define("modern build stack - transpiler string-like options", async function () {
  const currentMeteorModern = process.env.METEOR_MODERN;
  process.env.METEOR_MODERN = '';

  const s = new Sandbox();
  await s.init();

  await s.createApp("modern", "modern");
  await s.cd("modern");

  process.env.METEOR_DISABLE_COLORS = true;

  await writeModernConfig(s, {
    transpiler: {
      verbose: true,
    },
  });

  const run = s.run();

  run.waitSecs(waitToStart);
  await run.match("App running at");

  /* check transpiler options */
  await run.match(/\[Transpiler] Used SWC.*\(app\)/, false, true);
  await run.match(/\[Transpiler] Used SWC.*\(package\)/, false, true);

  await writeModernConfig(s, {
    transpiler: {
      verbose: true,
      excludeApp: ['main.js'],
    },
  });
  await run.match(/\[Transpiler] Used Babel.*\(app\)/, false, true);

  await writeModernConfig(s, {
    transpiler: {
      verbose: true,
      excludePackages: ['ejson'],
    },
  });
  await run.match(/\[Transpiler] Used Babel.*\(package\)/, false, true);

  await run.stop();

  process.env.METEOR_MODERN = currentMeteorModern;
});

async function writConfig(s, config) {
  const json = JSON.parse(s.read("package.json"));

  json.meteor = {
    ...json.meteor,
    ...config,
  };

  s.write("package.json", JSON.stringify(json, null, 2) + "\n");
}

async function writeSwcrcConfig(s, config) {
  let json = JSON.parse(s.read("package.json"));
  json = {
    ...json,
    ...config,
  };
  s.write(".swcrc", JSON.stringify(json, null, 2) + "\n");
}

selftest.define("modern build stack - transpiler custom .swcrc", async function () {
  const currentMeteorModern = process.env.METEOR_MODERN;
  process.env.METEOR_MODERN = '';

  const s = new Sandbox();
  await s.init();

  await s.createApp("modern", "modern");
  await s.cd("modern");

  await writConfig(s, {
    modern: true,
    mainModule: {
      client: 'client/main.js',
      server: 'server/alias.js',
    },
  });

  const run = s.run();

  run.waitSecs(waitToStart);
  await run.match("App running at");

  /* custom .swcrc and alias resolution */
  await run.match(/alias resolved/, false, true);

  await run.stop();

  process.env.METEOR_MODERN = currentMeteorModern;
});

selftest.define("modern build stack - transpiler files", async function () {
  const currentMeteorModern = process.env.METEOR_MODERN;
  process.env.METEOR_MODERN = '';

  const s = new Sandbox();
  await s.init();

  await s.createApp("modern", "modern");
  await s.cd("modern");

  await writConfig(s, {
    modern: true,
    mainModule: {
      client: 'client/main.js',
      server: 'server/javascript.js',
    },
  });

  const run = s.run();

  run.waitSecs(waitToStart);
  await run.match("App running at");

  await run.match(/javascript\.js/, false, true);

  await writConfig(s, {
    modern: true,
    mainModule: {
      client: 'client/main.js',
      server: 'server/javascript-component.jsx',
    },
  });
  await run.match(/javascript-component\.jsx/, false, true);

  await writConfig(s, {
    modern: true,
    mainModule: {
      client: 'client/main.js',
      server: 'server/typescript.ts',
    },
  });
  await run.match(/typescript\.ts/, false, true);

  await writConfig(s, {
    modern: true,
    mainModule: {
      client: 'client/main.js',
      server: 'server/typescript-component.tsx',
    },
  });
  await run.match(/typescript-component\.tsx/, false, true);

  await writeSwcrcConfig(s, {
    jsc: {
      parser: {
        syntax: 'typescript',
        tsx: true,
        jsx: true,
      },
    },
  });
  await writConfig(s, {
    modern: true,
    mainModule: {
      client: 'client/main.js',
      server: 'server/custom-component.js',
    },
  });
  await run.match(/custom-component\.js/, false, true);

  await run.stop();

  process.env.METEOR_MODERN = currentMeteorModern;
});


selftest.define("modern build stack - test minifier choice", async function () {
  // This test verifies which minifier (SWC or Terser) is used during the build process 
  // based on the configuration in package.json. It uses profiling to detect calls to 
  // the _minifyWithSWC and _minifyWithTerser methods.
  
  const currentMeteorModern = process.env.METEOR_MODERN;
  const currentTimeoutScaleFactor = process.env.TIMEOUT_SCALE_FACTOR;
  
  process.env.METEOR_MODERN = '';
  process.env.TIMEOUT_SCALE_FACTOR = '30';  // Increase timeout for this test

  const s = new Sandbox();
  await s.init();

  await s.createApp("modern", "modern");
  await s.cd("modern");

  // Enable profiling to see minifier output
  s.set("NODE_INSPECTOR_IPC", "1");
  
  // Test 1: Build with SWC minifier enabled
  console.log("Testing build with SWC minifier enabled");
  
  await writeModernConfig(s, {
    minifier: true
  });

  // First run the app to ensure it works
  const runSwc = s.run();
  runSwc.waitSecs(waitToStart);
  await runSwc.match("App running at");
  await runSwc.stop();
  
  // Now build the project with SWC
  const buildSwc = s.run("build", "../build-swc");
  buildSwc.waitSecs(60);
  await buildSwc.match("[DEBUG] Minifying using SWC", false, true);
  await buildSwc.expectExit(0);
  
  // Check what's in the build directory
  const swcBuildPath = files.pathJoin(s.cwd, "../build-swc");
  const swcTarGzPath = files.pathJoin(swcBuildPath, "modern.tar.gz");
  
  // Verify that the tarball exists
  selftest.expectEqual(files.exists(swcBuildPath), true);
  selftest.expectEqual(files.exists(swcTarGzPath), true);
  
  // Test 2: Build with Terser minifier
  console.log("Testing build with Terser minifier");
  
  await writeModernConfig(s, {
    minifier: false
  });

  // First run the app to ensure it works
  const runTerser = s.run();
  runTerser.waitSecs(waitToStart);
  await runTerser.match("App running at");
  await runTerser.stop();
  
  // Now build the project with Terser
  const buildTerser = s.run("build", "../build-terser");
  buildTerser.waitSecs(60);
  await buildTerser.match("[DEBUG] Minifying using Terser", false, true);
  await buildTerser.expectExit(0);
  
  // Check what's in the build directory
  const terserBuildPath = files.pathJoin(s.cwd, "../build-terser");
  const terserTarGzPath = files.pathJoin(terserBuildPath, "modern.tar.gz");
  
  // Verify that the tarball exists
  selftest.expectEqual(files.exists(terserBuildPath), true);
  selftest.expectEqual(files.exists(terserTarGzPath), true);
  
  // Test 3: Verify that we can detect a build failure with SWC and fallback to Terser
  console.log("Testing SWC failure fallback to Terser");
  
  // Modify a main file to cause SWC to fail, but which Terser can still process
  s.write("client/error.js", `
    // This file has syntax that SWC cannot process but Terser can
    const x = (function() { 
      return { a: 1, ...window.__meteor_runtime_config__ }; 
    })();
  `);
  
  await writeModernConfig(s, {
    minifier: true // Try using SWC first, but it should fail and fall back to Terser
  });
  
  // First run the app to ensure it works even with the error file
  const runFallback = s.run();
  runFallback.waitSecs(waitToStart);
  await runFallback.match("App running at");
  await runFallback.stop();
  
  // Run the build and check for fallback to Terser
  const buildFallback = s.run("build", "../build-fallback");
  buildFallback.waitSecs(60);
  // Should see Terser (fallback) being used when SWC fails
  await buildFallback.match("[DEBUG] Minifying using Terser", false, true);
  await buildFallback.expectExit(0);
  
  // Check what's in the build directory
  const fallbackBuildPath = files.pathJoin(s.cwd, "../build-fallback");
  const fallbackTarGzPath = files.pathJoin(fallbackBuildPath, "modern.tar.gz");
  
  // Verify that the tarball exists
  selftest.expectEqual(files.exists(fallbackBuildPath), true);
  selftest.expectEqual(files.exists(fallbackTarGzPath), true);

  process.env.METEOR_MODERN = currentMeteorModern;
});

