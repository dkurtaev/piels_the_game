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

  // Chose field dimensions for making resulting canvas sizes as powers of 2:
  // h = FIELD_WIDTH + FIELD_HEIGHT - 1;
  // w = 2 * h;
  // => FIELD_WIDTH + FIELD_HEIGHT - 1 = 2^k;
  // (Texturing requirements.)
  var FIELD_WIDTH = 129;
  var FIELD_HEIGHT = 128;

  if (!window.WebGLRenderingContext) {
    window.alert("Browser not supports WebGL");
    return;
  }

  var canvas = document.getElementById(canvasId);
  canvas.height = FIELD_WIDTH + FIELD_HEIGHT - 1;
  canvas.width = 2 * canvas.height;

  var gl = canvas.getContext("webgl", {antialias: false});
  if (!gl) {
    window.alert("WebGL initialization failed");
    return;
  }
  this.gl = gl;

  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Generate texture.
  var pixels = new Uint8Array(canvas.width * canvas.height * 3).fill(255);

  var x = 0;
  var upper_y = FIELD_WIDTH - 1, lower_y = upper_y;
  var upper_dy = -1, lower_dy = 1;
  for (var x = 0; x < canvas.width; x += 2) {
    for (var y = upper_y; y <= lower_y; ++y) {
      var offset = (y * canvas.width + x) * 3;
      pixels[offset] = 59;
      pixels[offset + 1] = 25;
      pixels[offset + 2] = 19;
      pixels[offset + 3] = 59;
      pixels[offset + 4] = 25;
      pixels[offset + 5] = 19;
    }
    if (upper_y == 0) {
      upper_dy = 1;
    }
    if (lower_y == canvas.height - 1) {
      lower_dy = -1;
    }
    upper_y += upper_dy;
    lower_y += lower_dy;
  }

  var tex_id = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex_id);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, canvas.width, canvas.height, 0,
                gl.RGB, gl.UNSIGNED_BYTE, pixels);
  gl.bindTexture(gl.TEXTURE_2D, null);

  this.shaderProgram = createShaderProgram(gl);

  gl.useProgram(this.shaderProgram);

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

  var loc_position = gl.getAttribLocation(this.shaderProgram, "a_position");
  var loc_tex_coords = gl.getAttribLocation(this.shaderProgram, "a_tex_coords");
  var loc_texture = gl.getUniformLocation(this.shaderProgram, "u_texture");

  gl.enable(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, tex_id);

  gl.uniform1i(loc_texture, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, position_vbo);
  gl.vertexAttribPointer(loc_position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(loc_position);

  gl.bindBuffer(gl.ARRAY_BUFFER, tex_coords_vbo);
  gl.vertexAttribPointer(loc_tex_coords, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(loc_tex_coords);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.disableVertexAttribArray(loc_tex_coords);
  gl.disableVertexAttribArray(loc_position);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.disable(gl.TEXTURE_2D);
  gl.useProgram(null);
};

function createShaderProgram(gl) {
  var vertexSrc =
    "attribute vec2 a_position;" +
    "attribute vec2 a_tex_coords;" +
    "varying vec2 v_tex_coords;" +
    "void main() {" +
      "v_tex_coords = a_tex_coords;" +
      "gl_Position = vec4(a_position, 0.0, 1.0);" +
    "}";
  var fragmentSrc =
    "precision mediump float;" +
    "uniform sampler2D u_texture;" +
    "varying vec2 v_tex_coords;" +
    "void main() {" +
      "gl_FragColor = texture2D(u_texture, v_tex_coords);" +
    "}";

  var shaderProgram = gl.createProgram();

  var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSrc);
  var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSrc);

  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);

  gl.linkProgram(shaderProgram);
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    window.alert("Program linking error: " +
                 gl.getProgramInfoLog(shaderProgram));
  }

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return shaderProgram;
};

function createShader(gl, type, src) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    window.alert("Shader compilation error: " + gl.getShaderInfoLog(shader));
  }
  return shader;
};
