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

  var canvas = document.getElementById("glcanvas");
  canvas.width = 2 * (FIELD_WIDTH + FIELD_HEIGHT - 1);
  canvas.height = 2 * FIELD_HEIGHT;
  this.gl = initWebGL(canvas);

  this.gl.clearColor(0.0, 0.8, 0.5, 1.0);
  this.gl.clear(this.gl.COLOR_BUFFER_BIT);
};

function initWebGL(canvas) {
  var gl = null;
  try {
    gl = canvas.getContext("webgl") ||
         canvas.getContext("experimental-webgl");
  } catch (err) {
    window.alert(err.message);
  }

  if (!gl) {
    window.alert("OpenGL context init failed.");
    gl = null;
  }

  return gl;
};
