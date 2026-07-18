/********************************************
 Project 01
 Land Use Land Cover Classification

 Study Area : Jhelum District, Pakistan
 Data       : Sentinel-2 Level-2A
 Platform   : Google Earth Engine
 Author     : Muneeb Ul Hassan
*********************************************/

//==================================
// Project Parameters
//==================================

// Study Area
var COUNTRY = 'Pakistan';
var DISTRICT = 'Jhelum District';
// Time Period
var START_DATE = '2025-10-01';
var END_DATE = '2025-10-31';
// Maximum Allowed Cloud Cover (%)
var MAX_CLOUD = 10;

//==================================
// 1. Study Area
//==================================

// Load administrative boundaries
var districts = ee.FeatureCollection("FAO/GAUL/2015/level2");
// Select Jhelum District
var studyArea = districts
  .filter(ee.Filter.eq('ADM0_NAME', COUNTRY))
  .filter(ee.Filter.eq('ADM2_NAME', DISTRICT));
// Display study area
Map.addLayer(studyArea, {color: 'red'}, 'Study Area');
// Center map
Map.centerObject(studyArea, 10);

//==================================
// 2. Load Sentinel-2
//==================================

// Load Sentinel-2 Surface Reflectance collection
var sentinel = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED");
// Filter images by study area
var sentinelFiltered = sentinel.filterBounds(studyArea);
// Filter images by date
sentinelFiltered = sentinelFiltered.filterDate(
    START_DATE,
    END_DATE
);
// Filter by cloud cover
sentinelFiltered = sentinelFiltered.filter(
    ee.Filter.lt(
        'CLOUDY_PIXEL_PERCENTAGE',
        MAX_CLOUD
    )
);
// Print image collection
print(sentinelFiltered);
print('Number of Images');
print(sentinelFiltered.size());

//==================================
// 3. Image Processing
//==================================

// Sentinel-2 bands for LULC classification
var bands = [
  'B2',   // Blue
  'B3',   // Green
  'B4',   // Red
  'B8',   // Near Infrared
  'B11',  // SWIR 1
  'B12'   // SWIR 2
];

// Create median composite
var composite = sentinelFiltered
  .select(bands)
  .median()
  .clip(studyArea);


// Debug
print('Composite Bands');
print(composite.bandNames());

//==================================
// 4. Visualization
//==================================

// Visualization parameters (True Color)
var trueColor = {
  bands: ['B4', 'B3', 'B2'],
  min: 0,
  max: 3000
};

// Display True Color
Map.addLayer(composite, trueColor, 'True Color');

// False Color Visualization
var falseColor = {
  bands: ['B8', 'B4', 'B3'],
  min: 0,
  max: 3000
};
Map.addLayer(
  composite,
  falseColor,
  'False Color'
);

//==================================
// 5. Spectral Indices
//==================================

// NDVI (Vegetation)
var ndvi = composite.normalizedDifference(['B8', 'B4'])
  .rename('NDVI');

// NDBI (Built-up)
var ndbi = composite.normalizedDifference(['B11', 'B8'])
  .rename('NDBI');

// MNDWI (Water)
var mndwi = composite.normalizedDifference(['B3', 'B11'])
  .rename('MNDWI');

// BSI (Bare Soil Index)
var bsi = composite.expression(
  '((SWIR + RED) - (NIR + BLUE)) / ((SWIR + RED) + (NIR + BLUE))',
  {
    SWIR: composite.select('B11'),
    RED: composite.select('B4'),
    NIR: composite.select('B8'),
    BLUE: composite.select('B2')
  }
).rename('BSI');


// Add indices to composite
composite = composite
  .addBands(ndvi)
  .addBands(ndbi)
  .addBands(mndwi)
  .addBands(bsi);


// Visualize NDVI
Map.addLayer(
  ndvi,
  {
    min: -1,
    max: 1,
    palette: ['blue', 'white', 'green']
  },
  'NDVI'
);


// Print predictor bands
print('Predictor Bands');
print(composite.bandNames());

// NDBI
Map.addLayer(
  ndbi,
  {
    min: -1,
    max: 1,
    palette: ['blue', 'white', 'red']
  },
  'NDBI',
  false
);

// MNDWI
Map.addLayer(
  mndwi,
  {
    min: -1,
    max: 1,
    palette: ['brown', 'white', 'blue']
  },
  'MNDWI',
  false
);

// BSI
Map.addLayer(
  bsi,
  {
    min: -1,
    max: 1,
    palette: ['green', 'white', 'brown']
  },
  'BSI',
  false
);

//==================================
// 6. Training Data
//==================================

// Convert MultiPolygon drawings into FeatureCollections

function geometryToFeatures(geometry, classValue) {

  var polygons = geometry.geometries();

  return ee.FeatureCollection(
    polygons.map(function(poly) {

      return ee.Feature(
        ee.Geometry(poly),
        {
          class: classValue
        }
      );

    })
  );
}


// Convert imported geometries

var water = geometryToFeatures(water1, 1);

var vegetation = geometryToFeatures(vegetation1, 2);

var agriculture = geometryToFeatures(agriculture1, 3);

var builtup = geometryToFeatures(buildup1, 4);

var barren = geometryToFeatures(barrenland1, 5);


// Merge classes

var trainingData = water
  .merge(vegetation)
  .merge(agriculture)
  .merge(builtup)
  .merge(barren);


// Display polygons

Map.addLayer(
  trainingData,
  {},
  'Training Polygons'
);


// Check polygon numbers

print('Water polygons:', water.size());

print('Vegetation polygons:', vegetation.size());

print('Agriculture polygons:', agriculture.size());

print('Built-up polygons:', builtup.size());

print('Barren polygons:', barren.size());

print(
  'Total polygons:',
  trainingData.size()
);



//==================================
// 7. Balanced Training Samples
//==================================


// Function to sample equal number of pixels from each class

function getSamples(classCollection, number) {

  var samples = composite.sampleRegions({

    collection: classCollection,

    properties: ['class'],

    scale: 10,

    geometries: false

  });


  return samples
    .randomColumn('random')
    .sort('random')
    .limit(number);

}


// Number of samples per class

var samplesPerClass = 4000;


// Generate balanced samples

var waterSamples =
    getSamples(water, samplesPerClass);


var vegetationSamples =
    getSamples(vegetation, samplesPerClass);


var agricultureSamples =
    getSamples(agriculture, samplesPerClass);


var builtupSamples =
    getSamples(builtup, samplesPerClass);


var barrenSamples =
    getSamples(barren, samplesPerClass);


// Merge all classes

var training = waterSamples
    .merge(vegetationSamples)
    .merge(agricultureSamples)
    .merge(builtupSamples)
    .merge(barrenSamples);


// Check results

print(
  'Final Training Sample Count',
  training.size()
);


print(
  'Balanced Class Distribution',
  training.aggregate_histogram('class')
);

//==================================
// 8. Random Forest Classification
//==================================


//==================================
// 8.1 Split Training and Validation Data
//==================================


// Add random column
var splitData = training.randomColumn('random');


// 80% Training Samples
var trainingSet = splitData.filter(
  ee.Filter.lt('random', 0.8)
);


// 20% Validation Samples
var validationSet = splitData.filter(
  ee.Filter.gte('random', 0.8)
);


// Check sample numbers

print(
  'Training Samples:',
  trainingSet.size()
);

print(
  'Validation Samples:',
  validationSet.size()
);



//==================================
// 8.2 Train Random Forest Classifier
//==================================


var classifier = ee.Classifier.smileRandomForest({
  
  numberOfTrees: 100

});


classifier = classifier.train({

  features: trainingSet,

  classProperty: 'class',

  inputProperties: composite.bandNames()

});



//==================================
// 8.3 Classify Sentinel-2 Composite
//==================================


var classified = composite.classify(classifier);



//==================================
// 8.4 Display LULC Classification
//==================================


var lulcPalette = [

  '0000FF', // Class 1 - Water

  '00FF00', // Class 2 - Vegetation

  'FFFF00', // Class 3 - Agriculture

  'FF0000', // Class 4 - Built-up

  'C2B280'  // Class 5 - Barren Land

];


Map.addLayer(

  classified,

  {
    min: 1,
    max: 5,
    palette: lulcPalette
  },

  'LULC Classification'

);

//==================================
// 9. Accuracy Assessment
//==================================


// Classify validation samples

var validated = validationSet.classify(classifier);


// Generate confusion matrix

var confusionMatrix = validated.errorMatrix(
  'class',
  'classification'
);


// Print confusion matrix

print(
  'Confusion Matrix',
  confusionMatrix
);


// Overall accuracy

print(
  'Overall Accuracy',
  confusionMatrix.accuracy()
);


// Kappa coefficient

print(
  'Kappa Coefficient',
  confusionMatrix.kappa()
);


// Producer Accuracy

print(
  'Producer Accuracy',
  confusionMatrix.producersAccuracy()
);


// User Accuracy

print(
  'User Accuracy',
  confusionMatrix.consumersAccuracy()
);

//==================================
// 10. LULC Area Calculation
//==================================


// Pixel area image (m²)

var pixelArea = ee.Image.pixelArea();


// Calculate area for each class

var areaImage = pixelArea.addBands(classified);


// Sum area by class

var areas = areaImage.reduceRegion({

  reducer: ee.Reducer.sum().group({

    groupField: 1,

    groupName: 'class'

  }),

  geometry: studyArea,

  scale: 10,

  maxPixels: 1e13

});


// Print area results

print(
  'LULC Area (m2)',
  areas
);

//==================================
// Convert Area to km2
//==================================


var areaList = ee.List(
  areas.get('groups')
);


var areaKm2 = areaList.map(function(item){

  item = ee.Dictionary(item);

  return ee.Dictionary({

    'Class':
      item.get('class'),

    'Area_km2':
      ee.Number(item.get('sum'))
      .divide(1e6)

  });

});


print(
  'LULC Area km2',
  areaKm2
);

//==================================
// 11. LULC Percentage Calculation
//==================================


// Total area of study region

var totalArea = ee.Number(
  studyArea.geometry().area()
).divide(1e6); // km2


print(
  'Total Study Area km2',
  totalArea
);


// Calculate percentage

var areaPercentage = areaList.map(function(item){

  item = ee.Dictionary(item);

  var classArea = ee.Number(
    item.get('sum')
  ).divide(1e6);


  var percentage = classArea
    .divide(totalArea)
    .multiply(100);


  return ee.Dictionary({

    'Class':
      item.get('class'),

    'Area_km2':
      classArea,

    'Percentage':
      percentage

  });

});


print(
  'LULC Area Percentage',
  areaPercentage
);
//==================================
// 12. LULC Chart with Class Names
//==================================


// Create FeatureCollection from area statistics

var chartData = ee.FeatureCollection(
  areaPercentage.map(function(item){

    item = ee.Dictionary(item);

    var classID = ee.Number(item.get('Class'));

    var className = ee.Algorithms.If(
      
      classID.eq(1),
      'Water',

      ee.Algorithms.If(
        classID.eq(2),
        'Vegetation',

        ee.Algorithms.If(
          classID.eq(3),
          'Agriculture',

          ee.Algorithms.If(
            classID.eq(4),
            'Built-up',

            'Barren Land'
          )
        )
      )
    );


    return ee.Feature(null, {

      'LULC_Name': className,

      'Area_km2': item.get('Area_km2'),

      'Percentage': item.get('Percentage')

    });

  })
);


// Print table

print('Chart Data', chartData);


// Create chart

var chart = ui.Chart.feature.byFeature({

  features: chartData,

  xProperty: 'LULC_Name',

  yProperties: ['Percentage']

})

.setChartType('ColumnChart')

.setOptions({

  title: 'LULC Distribution - Jhelum District',

  hAxis: {
    title: 'Land Cover Type'
  },

  vAxis: {
    title: 'Percentage (%)'
  },

  legend: {
    position: 'none'
  }

});


print(chart);

//==================================
// 13. LULC Legend
//==================================


// Create legend panel

var legend = ui.Panel({

  style: {
    position: 'bottom-left',
    padding: '8px 15px'
  }

});


// Legend title

var legendTitle = ui.Label({

  value: 'LULC Classification - Jhelum District',

  style: {
    fontWeight: 'bold',
    fontSize: '14px',
    margin: '0 0 8px 0'
  }

});


legend.add(legendTitle);



// Class names and colors

var names = [
  'Water',
  'Vegetation',
  'Agriculture',
  'Built-up',
  'Barren Land'
];


var colors = [
  '0000FF',
  '00FF00',
  'FFFF00',
  'FF0000',
  'C2B280'
];



// Create legend rows

for (var i = 0; i < names.length; i++) {


  var colorBox = ui.Label({

    style: {
      backgroundColor: '#' + colors[i],
      padding: '8px',
      margin: '0 8px 4px 0'
    }

  });


  var label = ui.Label({

    value: names[i],

    style:{
      margin:'0 0 4px 0'
    }

  });


  var row = ui.Panel({

    widgets:[
      colorBox,
      label
    ],

    layout: ui.Panel.Layout.Flow('horizontal')

  });


  legend.add(row);

}


// Add legend to map

Map.add(legend);

//==================================
// 13. Export LULC Classification
//==================================

Export.image.toDrive({

  image: classified,

  description: 'Jhelum_LULC_2025',

  folder: 'GEE_Exports',

  fileNamePrefix: 'Jhelum_LULC_2025',

  region: studyArea.geometry(),

  scale: 10,

  maxPixels: 1e13,

  fileFormat: 'GeoTIFF'

});
