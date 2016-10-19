function character() {
  // Character location in world coordinates.
  this.isInitialized = false;

  var self = this;
  readFile('images/knife', 'bin', function(bytes) {
    self.texture = {
      width: bytes[0],
      height: bytes[1],
      middleX: bytes[2],
      middleY: bytes[3],
      indentX: bytes[4],
      indentY: bytes[5],
      pixels: bytes.slice(6)
    };
    self.isInitialized = true;
    self.x = self.texture.indentX;
    self.y = self.texture.indentY;
    console.log('Character texture is initialized.');
  });
};

character.prototype.draw = function(fg_tex, gameField) {
  var isoCoord = gameField.worldToIsometric(this.x, this.y);
  var bg_offset = ((isoCoord.y - this.texture.middleY) * fg_tex.width +
                   isoCoord.x - this.texture.middleX) * 4;
  var tex_offset = 0;
  for (var y = 0; y < this.texture.height; ++y) {
    for (var x = 0; x < this.texture.width; ++x) {
      for (var i = 0; i < 4; ++i) {
        fg_tex.pixels[bg_offset + x * 4 + i] = this.texture.pixels[tex_offset++];
      }
    }
    bg_offset += 4 * fg_tex.width;
  }
};
