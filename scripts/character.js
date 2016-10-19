function character() {
  // Character location in world coordinates.
  this.x = 0;
  this.y = 0;
};

character.prototype.draw = function(fg_tex, gameField) {
  var isoCoord = gameField.worldToIsometric(this.x, this.y);
  var offset = (isoCoord.y * fg_tex.width + isoCoord.x) * 4;
  fg_tex.pixels[offset + 1] = 255;
  fg_tex.pixels[offset + 3] = 255;
  fg_tex.pixels[offset + 5] = 255;
  fg_tex.pixels[offset + 7] = 255;
};
