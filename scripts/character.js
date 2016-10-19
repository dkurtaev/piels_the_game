function character() {
  var x = 0;
  var y = 0;
};

character.prototype.draw = function(fg_tex) {
  fg_tex[1] = 255;
  fg_tex[3] = 255;
  fg_tex[5] = 255;
  fg_tex[7] = 255;
};
