const ee = require('@google/earthengine');
const privateKey = require('./private/plott-906-0fc429d7a212.json');
const prepare =  require('./prepare.js');

/**
 * 
 * @param {*} target 
 * @param {*} band1 
 * @param {*} band2 
 */
const invariantColorModel = function(target, band1, band2) {
  return(ee.Image(target).atan().divide(ee.Image(band1).max(band2)));
};



ee.data.authenticateViaPrivateKey(privateKey);
ee.initialize(null, null, function() {
  const NAIP = new ee.ImageCollection('NAIP: National Agriculture Imagery Program');
  const counties = ee.FeatureCollection('ft:1S4EB6319wWW2sWQDPhDvmSBIVrD3iEmCLYB7nMM');

  //NAIP Years
  const NAIP2015 = NAIP.filterDate('2009', '2016').filterBounds(geometry);
  console.log("NAIP2015",NAIP2015.limit(10));
    
  // Spatially mosaic the images in the collection and display.
  const mosaic = NAIP2015.mosaic();
  Map.addLayer(mosaic, {bands: ['R', 'G', 'B']}, 'NAIP DOQQ'); 
    
    //NC 37
    //Durham 63 
    //Wake 183
    //Orange 135
    console.log("Counties", counties);
    var nc = counties.filter(ee.Filter.eq('StateName', 'North Carolina'));
    var geometry = nc.filter(ee.Filter.or(ee.Filter.eq("CntyFips", 63), ee.Filter.eq("CntyFips", 183), ee.Filter.eq("CntyFips", 135)));
    console.log("NC", geometry);
    Map.addLayer(geometry, {}, 'Study Area');
    
    // Get information about the bands as a list; console.logs in console at right
    var features = prepare.prepareForClassification(NAIP2015, geometry);

    // Display the result.
    var ndviParams = {min: -1, max: 1, palette: ['blue', 'white', 'green']};
    Map.addLayer(ndvi.clip(geometry), ndviParams, 'NDVI');
    var newfc = Water.merge(Forest).merge(grass).merge(urban);
    
    var bands = features.bandNames(); //['R', 'B', 'G', 'N', 'nd'];
    
    // Sample the input imagery to get a FeatureCollection of training data.
    var training = features.select(bands).sampleRegions({
      collection: newfc,
      properties: ['class'],
      scale: 4
    });
    
    var classifier = ee.Classifier.randomForest(25).train({
      features: training,
      classProperty: 'class',
      inputProperties: bands
    });
    
    // Classify the input imagery.
    var classified = features.classify(classifier);
    
    
    
    // Get a confusion matrix representing resubstitution accuracy.
    var trainAccuracy = classifier.confusionMatrix();
    console.log('Resubstitution error matrix: ', trainAccuracy);
    console.log('Training overall accuracy: ', trainAccuracy.accuracy());
    console.log('Kappa: ', trainAccuracy.kappa());
    console.log('Customers Accuracy: ', trainAccuracy.consumersAccuracy());
    console.log('ProducersAccuracy: ', trainAccuracy.producersAccuracy());
    
    
    var palette = [
      'blue', // water
      'green', //forest
      'ECFF33',  // shrub, grass
      'FF3333' // urban
    ];
    
    console.log("Classified", classified);
    Map.addLayer(classified.clip(geometry), {min: 1, max: 4, palette: palette}, 'Land Use Classification');
    
    var classChart = ui.Chart.image.byClass(classified,'classification', geometry, ee.Reducer.mean(), 50, ['Water', 'Forest', 'Grass', 'Urban']);
    console.log(classChart);
},
function(e) {
  console.error('Authentication error: ' + e);
});




