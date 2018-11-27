const ee = require('@google/earthengine');
const prepare = require('./prepare');
const data = require('./data');

exports.main = function(req, res) {
    
    const NAIP = new ee.ImageCollection("USDA/NAIP/DOQQ");
    const counties = ee.FeatureCollection('ft:1S4EB6319wWW2sWQDPhDvmSBIVrD3iEmCLYB7nMM');
    const nc = counties.filter(ee.Filter.eq('StateName', 'North Carolina'));
    const geometry = nc.filter(ee.Filter.or(ee.Filter.eq("CntyFips", 63), ee.Filter.eq("CntyFips", 183), ee.Filter.eq("CntyFips", 135)));
    const watersheds = ee.FeatureCollection("USGS/WBD/2017/HUC10").filterBounds(geometry);
    
    // //NAIP Years
    const NAIP2016 = NAIP.filterDate('2016', '2017').filterBounds(geometry);
    // console.log("NAIP2016",NAIP.limit(10));
    // // Spatially mosaic the images in the collection and display.
    const mosaic = NAIP2016.mosaic();
    const ndvi = mosaic.normalizedDifference(['N', 'R']);
    const features = prepare(NAIP2016, geometry);
    const bands = features.bandNames(); //['R', 'B', 'G', 'N', 'nd'];
    const newfc =  data.training;//ee.FeatureCollection('ft:1g8GpoJOLdgSLLY96taclrCQjX32Djv8bK0i1auf0');
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
    const ndviParams = {min: -1, max: 1, palette: ['blue', 'white', 'green']};
    var palette = [
        'blue', // water
        'green', //forest
        'ECFF33',  // shrub, grass
        'FF3333' // urban
      ];
    const classifiedParams = {min: 1, max: 4, palette: palette};
    // const theMap = classified.getMap(classifiedParams);
    // console.log("classified: ", theMap);
    console.log("ndvi: ", ndvi);
    
    classified.getMap(classifiedParams, ( {mapid, token}) => {
          console.log(mapid);
          res.render('index', {mapid, token});
      });
};

