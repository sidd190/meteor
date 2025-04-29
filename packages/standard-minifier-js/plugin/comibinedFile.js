function countNewLines(code) {
    let lastIndex = code.indexOf('\n');
    let count = 0;
  
    while (lastIndex > -1) {
      count += 1;
      lastIndex = code.indexOf('\n', lastIndex + 1);
    }
  
    return count;
  }
  
export default class CombinedFile {
    constructor() {
      this._chunks = [];
      this._lineOffset = 0;
      this._addedFiles = 0;
    }
  
    addGeneratedCode(code) {
      let lineCount = countNewLines(code);
      this._chunks.push(code);
      this._lineOffset += lineCount;
    }
  
    addCodeWithMap(sourceName, {
      code,
      map,
      header,
      footer
    }) {
      this._addedFiles += 1;
      let newLines = countNewLines(code);
  
      if (header) {
        this.addGeneratedCode(header);
      }
  
      this._chunks.push({
        code,
        map,
        sourceName,
        lineOffset: this._lineOffset,
        lines: newLines + 1
      });
  
      if (footer) {
        this.addGeneratedCode(footer);
      }
  
      this._lineOffset += newLines;
    }
  
    _build() {
      let code = '';
  
      this._chunks.forEach(chunk => {
        if (typeof chunk === 'string') {
          code += chunk;
        } else if (typeof chunk === 'object') {
          code += chunk.code;
        } else {
          throw new Error(`unrecognized chunk type, ${typeof chunk}`);
        }
      });
  
      return { code };
    }
  
    // Optimization for when there are 1 or 0 files.
    // We can avoid parsing the source map if there is one, and instead
    // modify it to account for the offset from any generated code. 
    _build1File() {
      let file;
      let header = '';
      let footer = '';
  
      this._chunks.forEach(chunk => {
        if (typeof chunk === 'string') {
          if (file) {
            footer += chunk;
          } else {
            header += chunk;
          }
        } else if (typeof chunk === 'object') {
          if (file) {
            throw new Error('_build1File does not support multiple files');
          }
          file = chunk;
        } else {
          throw new Error(`unrecognized chunk type, ${typeof chunk}`);
        }
      });
  
      if (!file) {
        return { code: header + footer, map: null };
      }
  
      let map = file.map;
  
      // Bias the input sourcemap to account for the lines added by the header
      // This is much faster than parsing and re-encoding the sourcemap
      let headerMappings = ';'.repeat(file.lineOffset);
      map = Object.assign({}, map);
      map.mappings = headerMappings + map.mappings;
  
      return {
        code: header + file.code + footer,
        map
      };
    }
  
    build() {
      let code;
      let map;
  
      if (this._addedFiles < 2) {
        ({ code, map } = this._build1File());
      } else {
        ({ code } = this._build());
      }
  
      return { code, map };
    }
  }