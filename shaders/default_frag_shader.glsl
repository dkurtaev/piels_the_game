precision mediump float;

uniform sampler2D u_heights_map;
uniform sampler2D u_slice_tex;

varying vec2 v_tex_coords;

void main() {
  float height = texture2D(u_heights_map, v_tex_coords)[0];
  gl_FragColor = texture2D(u_slice_tex, vec2(height, 0.0));
}
