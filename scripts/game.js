function game(canvasId) {
  this.canvas = document.getElementById(canvasId);
  this.canvas.width = 512;
  this.canvas.height = 512;

  var gl = null;
  if (window.WebGLRenderingContext) {
    gl = this.canvas.getContext('webgl', {antialias: false});
  }
  if (!gl) {
    console.log('WebGL initialization failed');
    return;
  }

  var shadersInitialized = false;

  // Shader program setup.
  var self = this;
  readFile('shaders/default.vshader', 'text', function(vertShader) {
    readFile('shaders/default.fshader', 'text', function(fragShader) {
      self.shaderProgram = createShaderProgram(gl, vertShader, fragShader);
      shadersInitialized = true;
      console.log('Shader program is initialized.');
    });
  });

  this.gameField = new gameField(gl, this.canvas.width, this.canvas.height);
  this.character = new character();

  setTimeout(function() {
    if (shadersInitialized && self.gameField.isInitialized &&
        self.character.isInitialized) {
      self.initVBOs(gl);
      console.log('Game is started.');

      self.draw(gl);
    } else {
      console.log('Initialization timeout');
      window.alert('Initialization timeout');
    }
  }, 100);

  self.onkeydown = function(event) {
    switch (event.keyCode) {
      case 37: self.character.x -= 1; break;
      case 38: self.character.y -= 1; break;
      case 39: self.character.x += 1; break;
      case 40: self.character.y += 1; break;
      default: break;
    }
    self.draw(gl);
  };
};

game.prototype.initVBOs = function(gl) {
  // Two triangles:
  // (-1, 1)  *--------* (1, 1)
  //          |     /  |
  //          |  /     |
  // (-1, -1) *--------* (1, -1)
  // Drawing as strip.

  // Vertices position VBO.
  var data = [-1, 1, -1, -1, 1, 1, 1, -1];
  this.position_vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.position_vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

  // Vertices texture coordinates VBO.
  data = [0, 0, 0, 1, 1, 0, 1, 1];
  this.tex_coords_vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.tex_coords_vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, null);
};

game.prototype.draw = function(gl) {
  var fg_tex = {
    width: this.canvas.width,
    height: this.canvas.height,
    pixels: new Uint8Array(this.canvas.width * this.canvas.height * 4)
  };
  this.character.draw(fg_tex, this.gameField);

  var fg_tex_id = genTex(gl, gl.RGBA, fg_tex);

  var loc_heights = gl.getUniformLocation(this.shaderProgram, "u_heights_map");
  var loc_slice_tex = gl.getUniformLocation(this.shaderProgram, "u_slice_tex");
  var loc_fg_tex = gl.getUniformLocation(this.shaderProgram, "u_foreground_tex");

  // Drawing.
  gl.useProgram(this.shaderProgram);

  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, fg_tex_id);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, this.gameField.slice_tex_id);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, this.gameField.heights_tex_id);

  gl.uniform1i(loc_heights, 0);
  gl.uniform1i(loc_slice_tex, 1);
  gl.uniform1i(loc_fg_tex, 2);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.position_vbo);
  gl.vertexAttribPointer(Attrib.POSITION, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(Attrib.POSITION);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.tex_coords_vbo);
  gl.vertexAttribPointer(Attrib.TEX_COORDS, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(Attrib.TEX_COORDS);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  // Disable all enabled.
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.disableVertexAttribArray(Attrib.TEX_COORDS);
  gl.disableVertexAttribArray(Attrib.POSITION);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.useProgram(null);
};

function readFile(url, mode, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (this.readyState == 4) {
      if (this.status == 200) {
        if (mode == 'text') {
          callback(this.responseText);
        } else if (mode == 'bin') {
          callback(new Uint8Array(this.response));
        }
      } else {
        throw {message: "Failed reading " + url};
      }
    }
  }
  if (mode == 'bin') {
    xhr.responseType = "arraybuffer";
  }
  xhr.open("GET", url, true);
  xhr.send();
};

function genTex(gl, format, tex_data) {
  var id = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, id);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, format, tex_data.width, tex_data.height, 0,
                format, gl.UNSIGNED_BYTE, tex_data.pixels);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return id;
};
