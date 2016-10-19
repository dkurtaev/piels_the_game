function gameField(gl, canvasWidth, canvasHeight) {
  this.width = 100;
  this.height = 100;
  this.isInitialized = false;
  this.heights_tex_id = null;
  this.slice_tex_id = null;
  this.init(gl, canvasWidth, canvasHeight);
};

gameField.prototype.init = function(gl, canvasWidth, canvasHeight) {
  // Game field dimensions in isometric points.
  // Field example with width 5 and height 3:
  //         **
  //       **  **
  //     **      **
  //   **      **
  // **      **
  //   **  **
  //     **
  // Here each asterisk - colored pixel. Total width in pixels - 14, height - 7.
  var self = this;
  readFile("images/demo_pie_slice", "bin", function(bytes) {
    var slice_img = {
      width: bytes[0],
      height: bytes[1],
      pixels: bytes.slice(2)
    };
    self.initHeightsMap(gl, canvasWidth, canvasHeight, slice_img.width);

    self.heights_tex_id = genTex(gl, gl.LUMINANCE, self.heights_map);
    self.slice_tex_id = genTex(gl, gl.RGB, slice_img);

    self.isInitialized = true;
    console.log('Game field is initialized.');
  });
};

gameField.prototype.initHeightsMap = function(gl, canvasWidth, canvasHeight,
                                              sliceHeight) {
  var heights = new Uint8Array(canvasWidth * canvasHeight).fill(0);

  var x = 0, xlim = 2 * (this.width + this.height - 1);
  var upper_y = this.width - 1, lower_y = upper_y;
  var upper_dy = -1, lower_dy = 1;
  for (var x = 1; x <= xlim; x += 2) {
    // Top.
    for (var y = upper_y; y <= lower_y; ++y) {
      heights[y * canvasWidth + x] = 254;
      heights[y * canvasWidth + x + 1] = 254;
    }
    // Slice.
    var ratio = 1.0 / (sliceHeight - 1);
    // Exclude zero height and top height.
    for (var i = 0; i < sliceHeight - 2; ++i) {
      var height = 255 * (1.0 - (i + 1) * ratio);
      heights[(lower_y + 1 + i) * canvasWidth + x] = height;
      heights[(lower_y + 1 + i) * canvasWidth + x + 1] = height;
    }

    if (upper_y == 0) {
      upper_dy = 1;
    }
    if (lower_y == this.width + this.height - 2) {
      lower_dy = -1;
    }
    upper_y += upper_dy;
    lower_y += lower_dy;
  }

  // Borders.
  for (var i = 0; i < sliceHeight - 3; ++i) {
    var offset = (this.width + i) * canvasWidth;
    heights[offset] = 254;
    heights[offset + xlim + 1] = 254;
  }

  this.heights_map = {
    width: canvasWidth,
    height: canvasHeight,
    pixels: heights
  };
};

gameField.prototype.worldToIsometric = function(x, y) {
  var originX = 1;
  var originY = this.width - 1;
  return {
    x: originX + 2 * (x + y),
    y: originY - x + y
  }
};
