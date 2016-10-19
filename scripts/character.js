function character() {
  // Character location in world coordinates.
  this.isInitialized = false;
  this.last_direction = 'DOWN';

  var self = this;
  readFile('images/knife_left_down', 'bin', function(bytes) {
    self.left_down_texture = {
      width: bytes[0], height: bytes[1],
      middleX: bytes[2], middleY: bytes[3],
      indentX: bytes[4], indentY: bytes[5],
      pixels: bytes.slice(6)
    };
    // Initial knife direction is 'DOWN'.
    self.x = self.left_down_texture.indentX;
    self.y = self.left_down_texture.indentY;

    readFile('images/knife_right_up', 'bin', function(bytes) {
      self.right_up_texture = {
        width: bytes[0], height: bytes[1],
        middleX: bytes[2], middleY: bytes[3],
        indentX: bytes[4], indentY: bytes[5],
        pixels: bytes.slice(6)
      };
      self.isInitialized = true;
      console.log('Character textures are initialized.');
    });
  });
};

character.prototype.draw = function(fg_tex, gameField) {
  var isoCoord = gameField.worldToIsometric(this.x, this.y);
  var texture = (this.last_direction == 'LEFT' ||
                 this.last_direction == 'DOWN' ? this.left_down_texture :
                                                 this.right_up_texture);
  var reversed = (this.last_direction == 'LEFT' || this.last_direction == 'UP');

  var bg_offset = ((isoCoord.y - texture.middleY) * fg_tex.width +
                   isoCoord.x - texture.middleX) * 4;

   for (var y = 0; y < texture.height; ++y) {
     for (var x = 0; x < texture.width; ++x) {
       tex_offset = 4 * (y * texture.width +
                    (reversed ? texture.width - 1 - x : x));
       for (var i = 0; i < 4; ++i) {
         fg_tex.pixels[bg_offset + x * 4 + i] = texture.pixels[tex_offset + i];
       }
     }
     bg_offset += 4 * fg_tex.width;
   }
};

character.prototype.move = function(direction) {
  switch (direction) {
    case 'LEFT': this.x -= 1; break;
    case 'UP': this.y -= 1; break;
    case 'RIGHT': this.x += 1; break;
    case 'DOWN': this.y += 1; break;
    default: break;
  }
  this.last_direction = direction;
};
