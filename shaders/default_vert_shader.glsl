attribute vec2 a_position;
attribute vec2 a_tex_coords;

varying vec2 v_tex_coords;

void main() {
  v_tex_coords = a_tex_coords;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
