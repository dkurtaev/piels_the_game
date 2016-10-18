function gameField(canvasId) {
  var slice_img = {
    width: 16,
    height: 1,
    data: [
      255, 255, 255,
      59, 25, 19,
      128, 68, 50,
      128, 68, 50,
      128, 68, 50,
      221, 133, 81,
      221, 133, 81,
      253, 242, 210,
      253, 242, 210,
      253, 242, 210,
      221, 133, 81,
      221, 133, 81,
      128, 68, 50,
      128, 68, 50,
      128, 68, 50,
      59, 25, 19
    ]
  };
  this.init(canvasId, slice_img);
};

gameField.prototype.init = function(canvasId, slice_img) {
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
    throw {message: "Browser not supports WebGL"};
  }

  var canvas = document.getElementById(canvasId);
  canvas.height = Math.pow(2, Math.ceil(Math.log2(FIELD_WIDTH + FIELD_HEIGHT - 1 + 9)));
  canvas.width = Math.pow(2, Math.ceil(Math.log2(2 * canvas.height + 2)));

  var gl = canvas.getContext("webgl", {antialias: false});
  if (!gl) {
    throw {message: "WebGL initialization failed"};
  }
  this.gl = gl;

  // Generate texture.
  var heights_map = new Uint8Array(canvas.width * canvas.height).fill(0);

  var x = 0, xlim = 2 * (FIELD_WIDTH + FIELD_HEIGHT - 1);
  var upper_y = FIELD_WIDTH - 1, lower_y = upper_y;
  var upper_dy = -1, lower_dy = 1;
  for (var x = 1; x <= xlim; x += 2) {
    // Top.
    for (var y = upper_y; y <= lower_y; ++y) {
      heights_map[y * canvas.width + x] = 254;
      heights_map[y * canvas.width + x + 1] = 254;
    }
    // Slice.
    var ratio = 1.0 / (slice_img.width - 1);
    // Exclude zero height and top height.
    for (var i = 0; i < slice_img.width - 2; ++i) {
      var height = 255 * (1.0 - (i + 1) * ratio);
      heights_map[(lower_y + 1 + i) * canvas.width + x] = height;
      heights_map[(lower_y + 1 + i) * canvas.width + x + 1] = height;
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
  for (var i = 0; i < slice_img.width - 3; ++i) {
    var offset = (FIELD_WIDTH + i) * canvas.width;
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
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, slice_img.width, slice_img.height, 0,
                gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array(slice_img.data));

  gl.bindTexture(gl.TEXTURE_2D, null);

  // Shader program setup.
  var vertShader = document.getElementById("default_vert_shader").text;
  var fragShader = document.getElementById("default_frag_shader").text;
  this.shaderProgram = createShaderProgram(gl, vertShader, fragShader);

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

  gl.enable(gl.TEXTURE_2D);
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
  gl.disable(gl.TEXTURE_2D);
  gl.useProgram(null);
};
