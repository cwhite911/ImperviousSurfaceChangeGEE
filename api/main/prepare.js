const ee = require('@google/earthengine');

/**
 * 
 * @param {*} target 
 * @param {*} band1 
 * @param {*} band2 
 */
const invariantColorModel = function(target, band1, band2) {
  return(ee.Image(target).atan().divide(ee.Image(band1).max(band2)));
};

/**
 * prepareForClassification
 * @param {*} imageCollection 
 * @param {*} bounds 
 */
module.exports = async function(imageCollection, bounds) {
    var mosaic = imageCollection.mosaic();
    //Add NDVI
    var ndvi = mosaic.normalizedDifference(['N', 'R']);
  
    //Add canny
    var canny = ee.Algorithms.CannyEdgeDetector({
      image: mosaic, threshold: 10, sigma: 1
    });
    //Add hough
    var hough = ee.Algorithms.HoughTransform(canny, 256, 600, 100);
  
    //Hue Correction
    var red = mosaic.select('R');
    var blue = mosaic.select('B');
    var green = mosaic.select('G');
    
    var redICM = invariantColorModel(red, green, blue);
    var blueICM = invariantColorModel(blue, red, green);
    var greenICM = invariantColorModel(green, red, blue);
  
    // Define a "fat" Gaussian kernel.
  var fat = ee.Kernel.gaussian({
    radius: 3,
    sigma: 3,
    units: 'pixels',
    normalize: true,
    magnitude: -1
  });
  
  // Define a "skinny" Gaussian kernel.
  var skinny = ee.Kernel.gaussian({
    radius: 3,
    sigma: 1,
    units: 'pixels',
    normalize: true,
  });
  
  // Compute a difference-of-Gaussians (DOG) kernel.
  var dog = fat.add(skinny);
  
  // Compute the zero crossings of the second derivative, display.
  var zeroXings = mosaic.convolve(dog).zeroCrossing();
  var nir = mosaic.select('N');
  var glcm = nir.glcmTexture({size: 4});
  var contrast = glcm.select('N_contrast');
  var correlation = glcm.select('N_corr');             
  var secondMoment = glcm.select('N_sent');
   
  // Define a boxcar or low-pass kernel.
  var boxcar = ee.Kernel.square({
    radius: 7, units: 'pixels', normalize: true
  });
  
  // Smooth the image by convolving with the boxcar kernel.
  var smooth = mosaic.convolve(boxcar);
  
  var features = ee.Image(mosaic)
    .addBands(ndvi)
    .addBands(zeroXings)
    .addBands(contrast)
    .addBands(correlation)
    .addBands(smooth)
    .addBands(hough)
    .addBands(canny)
    .addBands(redICM)
    .addBands(blueICM)
    .addBands(greenICM);
    //.addBands(glcm) // 
  
    return features;
  };