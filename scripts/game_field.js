function gameField(canvasId) {
  // Game field dimensions in isometric points.
  // Field example with width 4 and height 3:
  //       **
  //     **  **
  //   **      **
  // **      **
  //   **  **
  //     **
  // Here each asterisk - colored pixel. Total width in pixels - 12, height - 6.
  var FIELD_WIDTH = 100;
  var FIELD_HEIGHT = 100;

  if (!window.WebGLRenderingContext) {
    window.alert("Browser not supports WebGL");
    return;
  }

  var canvas = document.getElementById(canvasId);
  canvas.width = 2 * (FIELD_WIDTH + FIELD_HEIGHT - 1);
  canvas.height = 2 * FIELD_HEIGHT;

  var gl = canvas.getContext("webgl", {antialias: false});
  if (!gl) {
    window.alert("WebGL initialization failed");
    return;
  }
  this.gl = gl;

  gl.clearColor(0.0, 0.8, 0.5, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  this.shaderProgram = createShaderProgram(gl);

  try {
  gl.useProgram(this.shaderProgram);

  var vbo = gl.createBuffer();
  var vertices = [0.0, 0.0, 1.0, 1.0];
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  var loc_position = gl.getAttribLocation(this.shaderProgram, "a_position");

  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.vertexAttribPointer(loc_position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(loc_position);
  gl.drawArrays(gl.LINES, 0, 2);

  gl.disableVertexAttribArray(loc_position);
} catch (err) {
  window.alert(err.message);
}

};

function createShaderProgram(gl) {
  var vertexSrc =
    "attribute vec2 a_position;" +
    "void main() {" +
      "gl_Position = vec4(a_position, 0.0, 1.0);" +
    "}";
  var fragmentSrc =
    "void main() {" +
      "gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);" +
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
