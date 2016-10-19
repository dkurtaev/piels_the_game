function character() {
  this.x = 0;
  this.y = 0;
};

character.prototype.draw = function(fg_tex) {
  var offset = (this.y * fg_tex.width + this.x) * 4;
  fg_tex.pixels[offset + 1] = 255;
  fg_tex.pixels[offset + 3] = 255;
  fg_tex.pixels[offset + 5] = 255;
  fg_tex.pixels[offset + 7] = 255;
};
