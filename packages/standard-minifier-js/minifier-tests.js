import { MeteorMinifier } from './plugin/minify-js.js';

// Mock para o ambiente de teste
class TestFile {
  constructor(content, path = 'test.js') {
    this._content = content;
    this._path = path;
  }
  
  getContentsAsString() {
    return this._content;
  }
  
  getPathInBundle() {
    return this._path;
  }
}

// Criamos uma classe para testes 
class TestMeteorMinifier extends MeteorMinifier {
  constructor(config) {
    super();
    // Override config para testes
    this.config = config;
    
    // Flags para rastrear chamadas de método
    this.swcCalled = false;
    this.terserCalled = false;
    
    // Override dos métodos para rastrear chamadas
    this._minifyWithSWC = this._trackingSWC.bind(this);
    this._minifyWithTerser = this._trackingTerser.bind(this);
  }
  
  _trackingSWC(file) {
    this.swcCalled = true;
    return { code: 'swc minified output' };
  }
  
  _trackingTerser(file) {
    this.terserCalled = true;
    return Promise.resolve({ code: 'terser minified output' });
  }
  
  // Para teste de fallback
  setSwcToThrow() {
    this._minifyWithSWC = () => {
      this.swcCalled = true;
      throw new Error('Mock SWC error');
    };
  }
}

// Helper de nudge para os testes
global.Plugin = {
  nudge: function() { }
};

Tinytest.add('standard-minifier-js - modern config - true value', function (test) {
  const minifier = new TestMeteorMinifier({ modern: true });
  
  const file = new TestFile('function test() { return 1 + 2; }');
  minifier.minifyOneFile(file);
  
  test.isTrue(minifier.swcCalled, 'SWC should be called when modern is true');
  test.isFalse(minifier.terserCalled, 'Terser should not be called when modern is true');
});

Tinytest.add('standard-minifier-js - modern config - false value', function (test) {
  const minifier = new TestMeteorMinifier({ modern: false });
  
  const file = new TestFile('function test() { return 1 + 2; }');
  minifier.minifyOneFile(file);
  
  test.isFalse(minifier.swcCalled, 'SWC should not be called when modern is false');
  test.isTrue(minifier.terserCalled, 'Terser should be called when modern is false');
});

Tinytest.add('standard-minifier-js - modern config - minifier false', function (test) {
  const minifier = new TestMeteorMinifier({ modern: { minifier: false } });
  
  const file = new TestFile('function test() { return 1 + 2; }');
  minifier.minifyOneFile(file);
  
  test.isFalse(minifier.swcCalled, 'SWC should not be called when modern.minifier is false');
  test.isTrue(minifier.terserCalled, 'Terser should be called when modern.minifier is false');
});

Tinytest.add('standard-minifier-js - legacy config - modernTranspiler false', function (test) {
  const minifier = new TestMeteorMinifier({ modernTranspiler: false });
  
  const file = new TestFile('function test() { return 1 + 2; }');
  minifier.minifyOneFile(file);
  
  test.isFalse(minifier.swcCalled, 'SWC should not be called when modernTranspiler is false');
  test.isTrue(minifier.terserCalled, 'Terser should be called when modernTranspiler is false');
});

Tinytest.add('standard-minifier-js - swc fallback to terser on error', function (test) {
  const minifier = new TestMeteorMinifier({ modern: true });
  minifier.setSwcToThrow();
  
  const file = new TestFile('function test() { return 1 + 2; }');
  minifier.minifyOneFile(file);
  
  test.isTrue(minifier.swcCalled, 'SWC should be called first');
  test.isTrue(minifier.terserCalled, 'Terser should be called when SWC fails');
}); 