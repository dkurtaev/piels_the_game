var Attrib = {
  POSITION: 0,
  TEX_COORDS: 1
};

function createShaderProgram(gl, vertShaderSource, fragShaderSource) {
  var shaderProgram = gl.createProgram();

  var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertShaderSource);
  var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragShaderSource);

  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);

  gl.bindAttribLocation(shaderProgram, Attrib.POSITION, "a_position");
  gl.bindAttribLocation(shaderProgram, Attrib.TEX_COORDS, "a_tex_coords");

  gl.linkProgram(shaderProgram);
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    throw {
      message: "Program linking error: " + gl.getProgramInfoLog(shaderProgram)
    };
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
    throw {
      message: "Shader compilation error: " + gl.getShaderInfoLog(shader)
    };
  }
  return shader;
};
