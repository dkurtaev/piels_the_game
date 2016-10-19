precision mediump float;

uniform sampler2D u_heights_map;
uniform sampler2D u_slice_tex;
uniform sampler2D u_foreground_tex;

varying vec2 v_tex_coords;

void main() {
  vec4 fg_color = texture2D(u_foreground_tex, v_tex_coords);
  if (fg_color.a == 0.0) {
    // Draw background.
    float height = texture2D(u_heights_map, v_tex_coords)[0];
    gl_FragColor = texture2D(u_slice_tex, vec2(height, 0.0));
  } else {
    // Draw foreground.
    gl_FragColor = fg_color;
  }
}
