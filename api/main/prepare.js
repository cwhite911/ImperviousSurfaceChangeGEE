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
exports = module.exports = async (imageCollection, bounds) => {
    let mosaic = imageCollection.mosaic();
    //Add NDVI
    const ndvi = mosaic.normalizedDifference(['N', 'R']);
  
    //Add canny
    const canny = ee.Algorithms.CannyEdgeDetector({
      image: mosaic, threshold: 10, sigma: 1
    });
    //Add hough
    const hough = ee.Algorithms.HoughTransform(canny, 256, 600, 100);
  
    //Hue Correction
    const red = mosaic.select('R');
    const blue = mosaic.select('B');
    const green = mosaic.select('G');
    
    const redICM = invariantColorModel(red, green, blue);
    const blueICM = invariantColorModel(blue, red, green);
    const greenICM = invariantColorModel(green, red, blue);
  
    // Define a "fat" Gaussian kernel.
  const fat = ee.Kernel.gaussian({
    radius: 3,
    sigma: 3,
    units: 'pixels',
    normalize: true,
    magnitude: -1
  });
  
  // Define a "skinny" Gaussian kernel.
  const skinny = ee.Kernel.gaussian({
    radius: 3,
    sigma: 1,
    units: 'pixels',
    normalize: true,
  });
  
  // Compute a difference-of-Gaussians (DOG) kernel.
  const dog = fat.add(skinny);
  
  // Compute the zero crossings of the second derivative, display.
  const zeroXings = mosaic.convolve(dog).zeroCrossing();
  const nir = mosaic.select('N');
  const glcm = nir.glcmTexture({size: 4});
  const contrast = glcm.select('N_contrast');
  const correlation = glcm.select('N_corr');             
  const secondMoment = glcm.select('N_sent');
   
  // Define a boxcar or low-pass kernel.
  const boxcar = ee.Kernel.square({
    radius: 7, units: 'pixels', normalize: true
  });
  
  // Smooth the image by convolving with the boxcar kernel.
  const smooth = mosaic.convolve(boxcar);
  
  let features = ee.Image(mosaic)
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