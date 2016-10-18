function gameField(canvasId) {
  this.width = 100;
  this.height = 100;
  this.shaderProgram = null;
  this.slice_img = null;

  this.init(canvasId);
};

gameField.prototype.init = function(canvasId) {
  // Game field dimensions in isometric points.
  // Field example with width 5 and height 3:
  //         **
  //       **  **
  //     **      **
  //   **      **
  // **      **
  //   **  **
  //     **
  // Here each asterisk - colored pixel. Total width in pixels - 14, height - 7.
  if (!window.WebGLRenderingContext) {
    throw {message: "Browser not supports WebGL"};
  }

  var canvas = document.getElementById(canvasId);
  canvas.height = Math.pow(2, Math.ceil(Math.log2(this.width + this.height - 1 + 9)));
  canvas.width = Math.pow(2, Math.ceil(Math.log2(2 * canvas.height + 2)));

  var gl = canvas.getContext("webgl", {antialias: false});
  if (!gl) {
    throw {message: "WebGL initialization failed"};
  }

  var shadersInitialized = false;
  var sliceTextureInitialized = false;

  // Shader program setup.
  var self = this;
  readTextFile("shaders/default_vert_shader.glsl", function(vertShader) {
    readTextFile("shaders/default_frag_shader.glsl", function(fragShader) {
      self.shaderProgram = createShaderProgram(gl, vertShader, fragShader);
      shadersInitialized = true;
    });
  });

  // Loading slice texture.
  readBinaryFile("images/demo_pie_slice", function(bytes) {
    self.slice_img = {
      width: bytes[0],
      height: bytes[1],
      data: bytes.slice(2)
    };
    sliceTextureInitialized = true;
  });

  setTimeout(function() {
    if (shadersInitialized && sliceTextureInitialized) {
      self.draw(gl, canvas);
    } else {
      window.alert("Initialization timeout");
    }
  }, 100);
};

gameField.prototype.draw = function(gl, canvas) {
  // Generate texture.
  var heights_map = new Uint8Array(canvas.width * canvas.height).fill(0);

  var x = 0, xlim = 2 * (this.width + this.height - 1);
  var upper_y = this.width - 1, lower_y = upper_y;
  var upper_dy = -1, lower_dy = 1;
  for (var x = 1; x <= xlim; x += 2) {
    // Top.
    for (var y = upper_y; y <= lower_y; ++y) {
      heights_map[y * canvas.width + x] = 254;
      heights_map[y * canvas.width + x + 1] = 254;
    }
    // Slice.
    var ratio = 1.0 / (this.slice_img.width - 1);
    // Exclude zero height and top height.
    for (var i = 0; i < this.slice_img.width - 2; ++i) {
      var height = 255 * (1.0 - (i + 1) * ratio);
      heights_map[(lower_y + 1 + i) * canvas.width + x] = height;
      heights_map[(lower_y + 1 + i) * canvas.width + x + 1] = height;
    }

    if (upper_y == 0) {
      upper_dy = 1;
    }
    if (lower_y == this.width + this.height - 2) {
      lower_dy = -1;
    }
    upper_y += upper_dy;
    lower_y += lower_dy;
  }

  // Borders.
  for (var i = 0; i < this.slice_img.width - 3; ++i) {
    var offset = (this.width + i) * canvas.width;
    heights_map[offset] = 254;
    heights_map[offset + xlim + 1] = 254;
  }

  var heights_tex_id = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, heights_tex_id);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, canvas.width, canvas.height, 0,
                gl.LUMINANCE, gl.UNSIGNED_BYTE, heights_map);

  var slice_tex_id = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, slice_tex_id);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, this.slice_img.width, this.slice_img.height, 0,
                gl.RGB, gl.UNSIGNED_BYTE, this.slice_img.data);

  gl.bindTexture(gl.TEXTURE_2D, null);

  var loc_heights = gl.getUniformLocation(this.shaderProgram, "u_heights_map");
  var loc_slice_tex = gl.getUniformLocation(this.shaderProgram, "u_slice_tex");

  // Vertices position VBO.
  var position_vbo = gl.createBuffer();
  // Two triangles:
  // (-1, 1)  *--------* (1, 1)
  //          |     /  |
  //          |  /     |
  // (-1, -1) *--------* (1, -1)
  // Drawing as strip.
  var data = [-1, 1, -1, -1, 1, 1, 1, -1];
  gl.bindBuffer(gl.ARRAY_BUFFER, position_vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // Vertices texture coordinates VBO.
  var tex_coords_vbo = gl.createBuffer();
  data = [0, 0, 0, 1, 1, 0, 1, 1];
  gl.bindBuffer(gl.ARRAY_BUFFER, tex_coords_vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // Drawing.
  gl.useProgram(this.shaderProgram);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, heights_tex_id);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, slice_tex_id);

  gl.uniform1i(loc_heights, 0);
  gl.uniform1i(loc_slice_tex, 1);

  gl.bindBuffer(gl.ARRAY_BUFFER, position_vbo);
  gl.vertexAttribPointer(Attrib.POSITION, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(Attrib.POSITION);

  gl.bindBuffer(gl.ARRAY_BUFFER, tex_coords_vbo);
  gl.vertexAttribPointer(Attrib.TEX_COORDS, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(Attrib.TEX_COORDS);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.disableVertexAttribArray(Attrib.TEX_COORDS);
  gl.disableVertexAttribArray(Attrib.POSITION);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.useProgram(null);
};

function readBinaryFile(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (this.readyState == 4) {
      if (this.status == 200) {
        callback(new Uint8Array(this.response));
      } else {
        throw {message: "Failed reading " + url};
      }
    }
  }
  xhr.responseType = "arraybuffer";
  xhr.open("GET", url, true);
  xhr.send();
};
