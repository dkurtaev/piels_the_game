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
  var FIELD_WIDTH = 100;
  var FIELD_HEIGHT = 100;

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

  this.shaderProgram = createShaderProgram(gl);

  gl.useProgram(this.shaderProgram);

  var vbo = gl.createBuffer();
  var vertices = [0, FIELD_WIDTH - 1, 2 * FIELD_HEIGHT, canvas.height,
                  2 * FIELD_HEIGHT, canvas.height - 1,
                  canvas.width, FIELD_HEIGHT - 1,
                  canvas.width - 2, FIELD_HEIGHT - 1,
                  2 * (FIELD_WIDTH - 2), -1,
                  2 * (FIELD_WIDTH - 1), 1,
                  0, FIELD_WIDTH];
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  var loc_position = gl.getAttribLocation(this.shaderProgram, "a_position");
  var loc_projection =
      gl.getUniformLocation(this.shaderProgram, "u_projection_matrix");

  var proj_matrix = orthoM(0, canvas.width, canvas.height, 0);
  gl.uniformMatrix4fv(loc_projection, false, new Float32Array(proj_matrix));

  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.vertexAttribPointer(loc_position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(loc_position);
  gl.drawArrays(gl.LINES, 0, 8);

  gl.disableVertexAttribArray(loc_position);
};

function createShaderProgram(gl) {
  var vertexSrc =
    "attribute vec2 a_position;" +
    "uniform mat4 u_projection_matrix;" +
    "void main() {" +
      "gl_Position = u_projection_matrix * vec4(a_position, 0.0, 1.0);" +
    "}";
  var fragmentSrc =
    "void main() {" +
      "gl_FragColor = vec4(0.23, 0.09, 0.07, 1.0);" +
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

function orthoM(left, right, bottom, top) {
  // near = 0, far = 1.
  var reverted_width = 1.0 / (right - left);
  var reverted_height = 1.0 / (top - bottom);
  return [2 * reverted_width, 0, 0, 0,
          0, 2 * reverted_height, 0, 0,
          0, 0, -2, 0,
          -(right + left) * reverted_width, -(top + bottom) * reverted_height,
          -1, 1];
};
