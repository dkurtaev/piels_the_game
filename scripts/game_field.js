function gameField(canvasId) {
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

  // Chose field dimensions for making resulting canvas sizes as powers of 2
  // (Texturing requirements).
  var FIELD_WIDTH = 100;
  var FIELD_HEIGHT = 100;

  if (!window.WebGLRenderingContext) {
    window.alert("Browser not supports WebGL");
    return;
  }

  var canvas = document.getElementById(canvasId);
  canvas.height = Math.pow(2, Math.ceil(Math.log2(FIELD_WIDTH + FIELD_HEIGHT - 1 + 9)));
  canvas.width = Math.pow(2, Math.ceil(Math.log2(2 * canvas.height + 2)));
  console.log(canvas.height + " " + canvas.width);

  var gl = canvas.getContext("webgl", {antialias: false});
  if (!gl) {
    window.alert("WebGL initialization failed");
    return;
  }
  this.gl = gl;

  // Generate texture.
  var pixels = new Uint8Array(canvas.width * canvas.height * 3).fill(255);

  var x = 0;
  var upper_y = FIELD_WIDTH - 1, lower_y = upper_y;
  var upper_dy = -1, lower_dy = 1;
  for (var x = 1; x <= 2 * (FIELD_WIDTH + FIELD_HEIGHT - 1); x += 2) {
    // Top.
    for (var y = upper_y; y <= lower_y; ++y) {
      var offset = (y * canvas.width + x) * 3;
      pixels[offset] = 59;
      pixels[offset + 1] = 25;
      pixels[offset + 2] = 19;
      pixels[offset + 3] = 59;
      pixels[offset + 4] = 25;
      pixels[offset + 5] = 19;
    }
    // Slice.
    var colors = [128, 68, 50, 128, 68, 50, 221, 133, 81, 253, 242, 210,
                  253, 242, 210, 221, 133, 81, 128, 68, 50, 128, 68, 50,
                  59, 25, 19];
    for (var i = 0; i < colors.length / 3; ++i) {
      for (var j = 0; j < 2; ++j) {
        var offset = ((lower_y + 1 + i) * canvas.width + x + j) * 3;
        pixels[offset] = colors[i * 3];
        pixels[offset + 1] = colors[i * 3 + 1];
        pixels[offset + 2] = colors[i * 3 + 2];
      }
    }

    if (upper_y == 0) {
      upper_dy = 1;
    }
    if (lower_y == FIELD_WIDTH + FIELD_HEIGHT - 2) {
      lower_dy = -1;
    }
    upper_y += upper_dy;
    lower_y += lower_dy;
  }
  // Borders.
  for (var i = 0; i < 8; ++i) {
    var offset = ((FIELD_WIDTH + i) * canvas.width) * 3;
    pixels[offset] = 59;
    pixels[offset + 1] = 25;
    pixels[offset + 2] = 19;

    offset = ((FIELD_HEIGHT + i) * canvas.width +
              2 * (FIELD_WIDTH + FIELD_HEIGHT - 1) + 1) * 3;
    pixels[offset] = 59;
    pixels[offset + 1] = 25;
    pixels[offset + 2] = 19;
  }

  var tex_id = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex_id);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, canvas.width, canvas.height, 0,
                gl.RGB, gl.UNSIGNED_BYTE, pixels);
  gl.bindTexture(gl.TEXTURE_2D, null);

  // Shader program setup.
  var vertShader = document.getElementById("default_vert_shader").text;
  var fragShader = document.getElementById("default_frag_shader").text;
  this.shaderProgram = createShaderProgram(gl, vertShader, fragShader);

  var loc_texture = gl.getUniformLocation(this.shaderProgram, "u_texture");

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

  gl.enable(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, tex_id);

  gl.uniform1i(loc_texture, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, position_vbo);
  gl.vertexAttribPointer(Attrib.POSITION, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(Attrib.POSITION);

  gl.bindBuffer(gl.ARRAY_BUFFER, tex_coords_vbo);
  gl.vertexAttribPointer(Attrib.TEX_COORDS, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(Attrib.TEX_COORDS);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.disableVertexAttribArray(Attrib.TEX_COORDS);
  gl.disableVertexAttribArray(Attrib.POSITION);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.disable(gl.TEXTURE_2D);
  gl.useProgram(null);
};
