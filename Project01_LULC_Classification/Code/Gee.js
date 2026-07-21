/********************************************
 Project 01
 Land Use Land Cover Classification
 Study Area : Jhelum District, Punjab, Pakistan
 Data       : Sentinel-2 Level-2A (Surface Reflectance)
 Reference  : ESA WorldCover v200 (automated training)
              + Manually digitized polygons (training + validation)
 Classes    : 0=Water, 1=Vegetation, 2=Agriculture, 3=Bare Soil, 4=Built-up
 Platform   : Google Earth Engine
 Author     : Muneeb Ul Hassan
*********************************************/

//==================================
// Project Parameters
//==================================
var COUNTRY  = 'Pakistan';
var DISTRICT = 'Jhelum District';   // Confirmed working exact match in FAO GAUL

var START_DATE = '2024-01-01';
var END_DATE   = '2024-05-31';
var MAX_CLOUD  = 5;

var classPalette = ['0000FF', '00FF00', 'FFFF00', 'D2B48C', 'FF0000'];
// Water=Blue, Vegetation=Green, Agriculture=Yellow, Bare Soil=Tan, Built-up=Red

//==================================
// 1. Study Area
//==================================
var districts = ee.FeatureCollection("FAO/GAUL/2015/level2");

var studyArea = districts
  .filter(ee.Filter.eq('ADM0_NAME', COUNTRY))
  .filter(ee.Filter.eq('ADM2_NAME', DISTRICT));

// Sanity check - should be 1 (one matching district). If 0, the name doesn't match.
print('Study area features found (should be 1):', studyArea.size());

Map.addLayer(studyArea, {color: 'red'}, '01_StudyArea_Boundary_Jhelum');
Map.centerObject(studyArea, 10);

print(studyArea.geometry().geometries());
var polygon = ee.Geometry(
  studyArea.geometry().geometries().get(1)
);

var studyAreaPolygon = ee.Feature(polygon);

//==================================
// 2. Sentinel-2 Image Collection
//==================================
function maskS2clouds(image) {
  var qa = image.select('QA60');
  var cloudBitMask  = 1 << 10;
  var cirrusBitMask = 1 << 11;
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
      .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
  return image.updateMask(mask).divide(10000);
}

var s2Collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterDate(START_DATE, END_DATE)
  .filterBounds(studyArea)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', MAX_CLOUD))
  .map(maskS2clouds);

print('Number of Sentinel-2 images found:', s2Collection.size());

var trueColorVis  = {bands: ['B4', 'B3', 'B2'], min: 0, max: 0.3};
var falseColorVis = {bands: ['B8', 'B4', 'B3'], min: 0, max: 0.4};

// 2a - single raw scene (before compositing)
var singleImage = s2Collection.first().clip(studyArea);
Map.addLayer(singleImage, trueColorVis, '02_DrySeason_SingleRawScene_TrueColor', true);

// 2b - median composite (after compositing)
var composite = s2Collection.median().clip(studyArea);
Map.addLayer(composite, trueColorVis, '03_DrySeason_Composite_TrueColor', true);

// 2c - false color composite (vegetation emphasis)
Map.addLayer(composite, falseColorVis, '04_DrySeason_Composite_FalseColor', true);

//==================================
// 3. Spectral Indices (Dry Season)
//==================================
var ndvi = composite.normalizedDifference(['B8', 'B4']).rename('NDVI');
var ndwi = composite.normalizedDifference(['B3', 'B8']).rename('NDWI');
var ndbi = composite.normalizedDifference(['B11', 'B8']).rename('NDBI');

Map.addLayer(ndvi, {min: -0.2, max: 0.8, palette: ['8B4513','FFFFFF','00FF00']}, '05_DrySeason_NDVI', true);
Map.addLayer(ndwi, {min: -0.5, max: 0.5, palette: ['8B4513','FFFFFF','0000FF']}, '06_DrySeason_NDWI', true);
Map.addLayer(ndbi, {min: -0.3, max: 0.3, palette: ['00FF00','FFFFFF','FF00FF']}, '07_DrySeason_NDBI', true);

//==================================
// 3d. Brightness Index (helps separate Built-up from Bare Soil)
//==================================
var brightness = composite.select(['B2','B3','B4']).reduce(ee.Reducer.mean()).rename('Brightness');

// Display it - dark = low reflectance (water, shadow), bright = high reflectance
// (bare soil, built-up, dry fields all read fairly bright here)
Map.addLayer(brightness, {min: 0, max: 0.3, palette: ['000000','888888','FFFFFF']}, '08_DrySeason_Brightness', true);
//==================================
// 3j. Texture Feature (GLCM Contrast) - separates uniform Bare Soil from
// heterogeneous Built-up areas using spatial pattern, not just reflectance
//==================================
// GLCM requires an integer band scaled 0-255
var grayForTexture = brightness.multiply(255).toInt().rename('gray');

// Contrast: measures local pixel-to-pixel variation in a small window.
// Low contrast = uniform surface (bare soil, water, healthy crop field).
// High contrast = mixed surface (built-up: roads, roofs, shadows together).
var glcm = grayForTexture.glcmTexture({size: 3});
var texture = glcm.select('gray_contrast').rename('Texture');

Map.addLayer(texture, {min: 0, max: 500, palette: ['000000','FFFFFF','FF0000']}, '09_Texture_GLCM_Contrast', true);

//==================================
// 3e. Second Season Composite (Wet/Monsoon Season) - Seasonal Signal
//==================================
var WET_START = '2024-07-01';
var WET_END   = '2024-09-30';

var s2CollectionWet = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterDate(WET_START, WET_END)
  .filterBounds(studyArea)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
  .map(maskS2clouds);

print('Number of wet-season Sentinel-2 images found:', s2CollectionWet.size());

var compositeWet = s2CollectionWet.median().clip(studyArea);
var ndviWet = compositeWet.normalizedDifference(['B8', 'B4']).rename('NDVI_wet');
var ndviDiff = ndviWet.subtract(ndvi).rename('NDVI_diff');

Map.addLayer(compositeWet, trueColorVis, '10_WetSeason_Composite_TrueColor', true);
Map.addLayer(ndviWet, {min: -0.2, max: 0.8, palette: ['8B4513','FFFFFF','00FF00']}, '11_WetSeason_NDVI', true);
Map.addLayer(ndviDiff, {min: -0.5, max: 0.5, palette: ['FF0000','FFFFFF','0000FF']}, '12_Seasonal_NDVI_Change_WetMinusDry', true);

//==================================
// 3i. Final Input Features + Classification Image
//==================================
// NOW that ndvi, ndwi, ndbi, brightness, ndviWet, ndviDiff all exist above,
// it's safe to reference all of them here.
var inputFeatures = ['B2','B3','B4','B8','B11','B12','NDVI','NDWI','NDBI','Brightness','NDVI_wet','NDVI_diff','Texture'];

var classificationImage = composite.select(['B2','B3','B4','B8','B11','B12'])
  .addBands(ndvi)
  .addBands(ndwi)
  .addBands(ndbi)
  .addBands(brightness)
  .addBands(ndviWet)
  .addBands(ndviDiff)
  .addBands(texture);

//==================================
// 4. Reference Data for Automated Samples (ESA WorldCover)
//==================================
var worldcover = ee.ImageCollection('ESA/WorldCover/v200').first().clip(studyArea);

var refClasses = worldcover.remap(
  [10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 100],
  [1,  1,  1,  2,  4,  3,  3,  0,  0,  1,  1]
).rename('class');

Map.addLayer(refClasses, {min: 0, max: 4, palette: classPalette}, '13_Reference_ESA_WorldCover_Reclassified', true);

//==================================
// 5. Automated Stratified Samples (6000 total: 1200 x 5 classes)
//==================================
var sampleImage = refClasses.addBands(classificationImage);

var autoSamples = sampleImage.stratifiedSample({
  numPoints: 2500,
  classBand: 'class',
  region: studyArea,
  scale: 10,
  seed: 42,
  geometries: true
});

var autoSamplesRandom = autoSamples.randomColumn('random', 42);
var autoTrainingSet = autoSamplesRandom.filter(ee.Filter.lt('random', 0.7));
var autoTestingSet  = autoSamplesRandom.filter(ee.Filter.gte('random', 0.7));

print('Automated total samples:', autoSamples.size());
print('Automated training samples:', autoTrainingSet.size());
print('Automated testing samples:', autoTestingSet.size());

// 5a - display training points color-coded by class
var trainingStyled = autoTrainingSet.map(function(f) {
  var cls = ee.Number(f.get('class'));
  var color = ee.List(classPalette).get(cls);
  return f.set('style', {color: color, pointSize: 4});
});
Map.addLayer(trainingStyled.style({styleProperty: 'style'}), {}, '14_AutomatedTrainingPoints', true);

//==================================
// 6. Manual Training + Validation Polygons
//==================================
// Your polygons have property names like "Water", "Vegetation" etc. instead of
// "class" - instead of relying on that, we explicitly assign the correct
// numeric class value ourselves here, per collection. This sidesteps the
// naming mismatch entirely and is more robust than editing each import by hand.
function assignClass(fc, classValue) {
  return fc.map(function(f) {
    return f.set('class', classValue);
  }).select(['class']);   // keep ONLY the 'class' column - guarantees identical schema
}

var trainingPolysMerged = assignClass(water_poly, 0)
  .merge(assignClass(veg_poly, 1))
  .merge(assignClass(agri_poly, 2))
  .merge(assignClass(bareSoil_poly, 3))
  .merge(assignClass(builtup_poly, 4));

var validationPolysMerged = assignClass(water_val, 0)
  .merge(assignClass(veg_val, 1))
  .merge(assignClass(agri_val, 2))
  .merge(assignClass(bareSoil_val, 3))
  .merge(assignClass(builtup_val, 4));

var manualTrainingSamples = classificationImage.sampleRegions({
  collection: trainingPolysMerged,
  properties: ['class'],
  scale: 10,
  tileScale: 4
}).filter(ee.Filter.notNull(['class']));

var manualValidationSamples = classificationImage.sampleRegions({
  collection: validationPolysMerged,
  properties: ['class'],
  scale: 10,
  tileScale: 4
}).filter(ee.Filter.notNull(['class']));

print('Manual training pixels (raw, before capping):', manualTrainingSamples.size());
print('Manual validation pixels (independent):', manualValidationSamples.size());

//==================================
// 6b. Balance Manual Training Pixels (cap per class, avoid dominance)
//==================================
// Randomly subsample each class down to a fixed cap so manual polygon pixels
// (often tens of thousands) don't overwhelm the automated points (a few
// thousand). Cap raised to 2500/class to match the increased automated
// sample size (numPoints: 2500 in Section 5) - more examples per class
// generally helps the Random Forest learn cleaner class boundaries.
var MANUAL_CAP_PER_CLASS = 2500;

function capClass(fc, classValue, capSize) {
  return fc.filter(ee.Filter.eq('class', classValue))
    .randomColumn('r', 7)
    .sort('r')
    .limit(capSize);
}

var manualTrainingBalanced = capClass(manualTrainingSamples, 0, MANUAL_CAP_PER_CLASS)
  .merge(capClass(manualTrainingSamples, 1, MANUAL_CAP_PER_CLASS))
  .merge(capClass(manualTrainingSamples, 2, MANUAL_CAP_PER_CLASS))
  .merge(capClass(manualTrainingSamples, 3, MANUAL_CAP_PER_CLASS))
  .merge(capClass(manualTrainingSamples, 4, MANUAL_CAP_PER_CLASS));

print('Manual training pixels (balanced/capped):', manualTrainingBalanced.size());

// Sanity check: print per-class counts for BOTH sources side by side, so you
// can see if any single class is badly underrepresented on either side
for (var c = 0; c < 5; c++) {
  print('Class ' + c + ' - automated count:',
    autoTrainingSet.filter(ee.Filter.eq('class', c)).size());
  print('Class ' + c + ' - manual (capped) count:',
    manualTrainingBalanced.filter(ee.Filter.eq('class', c)).size());
}

//==================================
// 7. Combine Automated + Balanced Manual Training Data, Train Random Forest
//==================================
var finalTrainingSet = autoTrainingSet.merge(manualTrainingBalanced);
print('FINAL combined training set size:', finalTrainingSet.size());

var classifier = ee.Classifier.smileRandomForest({numberOfTrees: 300})
  .train({
    features: finalTrainingSet,
    classProperty: 'class',
    inputProperties: inputFeatures
  });

//==================================
// 8. Run Final Classification
//==================================
var classified = classificationImage.select(inputFeatures).classify(classifier);
Map.addLayer(classified, {min: 0, max: 4, palette: classPalette}, '15_FINAL_LULC_Classification_2024', true);

//==================================
// 9. Two Accuracy Assessments (report both, honestly labeled)
//==================================
// (A) Automated held-out test set
var autoTestClassified = autoTestingSet.classify(classifier);
var autoConfusion = autoTestClassified.errorMatrix('class', 'classification');
print('--- (A) Automated Test Set Accuracy ---');
print('Confusion Matrix (auto):', autoConfusion);
print('Overall Accuracy (auto):', autoConfusion.accuracy());
print('Kappa (auto):', autoConfusion.kappa());

// (B) Independent manual validation polygons (more rigorous - report this primarily)
var manualValClassified = manualValidationSamples.classify(classifier);
var manualConfusion = manualValClassified.errorMatrix('class', 'classification');
print('--- (B) Independent Manual Validation Accuracy ---');
print('Confusion Matrix (manual val):', manualConfusion);
print('Overall Accuracy (manual val):', manualConfusion.accuracy());
print('Kappa (manual val):', manualConfusion.kappa());

//==================================
// 10. Feature Importance
//==================================
var importance = ee.Dictionary(classifier.explain().get('importance'));
print('Feature Importance:', importance);

//==================================
// 11. Export ALL Layers to Google Drive (clearly named, with season/type labels)
//==================================

// 01 - Study Area Boundary (vector)

Export.table.toDrive({
  collection: ee.FeatureCollection([studyAreaPolygon]),
  description: '01_StudyArea_Boundary_Jhelum',
  folder: 'GIS_Portfolio',
  fileFormat: 'SHP'
});

// 02 - Single Raw Uncomposited Scene, Dry Season, True Color
Export.image.toDrive({
  image: singleImage.select(['B4','B3','B2']),
  description: '02_DrySeason_SingleRawScene_TrueColor',
  folder: 'GIS_Portfolio', region: studyArea, scale: 10, maxPixels: 1e9
});

// 03 - Composite, Dry Season, True Color
Export.image.toDrive({
  image: composite.select(['B4','B3','B2']),
  description: '03_DrySeason_Composite_TrueColor',
  folder: 'GIS_Portfolio', region: studyArea, scale: 10, maxPixels: 1e9
});

// 04 - Composite, Dry Season, False Color (vegetation = red)
Export.image.toDrive({
  image: composite.select(['B8','B4','B3']),
  description: '04_DrySeason_Composite_FalseColor',
  folder: 'GIS_Portfolio', region: studyArea, scale: 10, maxPixels: 1e9
});

// 05 - NDVI, Dry Season
Export.image.toDrive({
  image: ndvi,
  description: '05_DrySeason_NDVI',
  folder: 'GIS_Portfolio', region: studyArea, scale: 10, maxPixels: 1e9
});

// 06 - NDWI, Dry Season
Export.image.toDrive({
  image: ndwi,
  description: '06_DrySeason_NDWI',
  folder: 'GIS_Portfolio', region: studyArea, scale: 10, maxPixels: 1e9
});

// 07 - NDBI, Dry Season
Export.image.toDrive({
  image: ndbi,
  description: '07_DrySeason_NDBI',
  folder: 'GIS_Portfolio', region: studyArea, scale: 10, maxPixels: 1e9
});

// 08 - Brightness Index, Dry Season
Export.image.toDrive({
  image: brightness,
  description: '08_DrySeason_Brightness(Contrast_Texture)',
  folder: 'GIS_Portfolio', region: studyArea, scale: 10, maxPixels: 1e9
});

// 09 - Texture (GLCM Contrast)
Export.image.toDrive({
  image: texture,
  description: '09_Texture_GLCM_Contrast',
  folder: 'GIS_Portfolio', region: studyArea, scale: 10, maxPixels: 1e9
});

// 10 - Composite, Wet Season, True Color
Export.image.toDrive({
  image: compositeWet.select(['B4','B3','B2']),
  description: '10_WetSeason_Composite_TrueColor',
  folder: 'GIS_Portfolio', region: studyArea, scale: 10, maxPixels: 1e9
});

// 11 - NDVI, Wet Season
Export.image.toDrive({
  image: ndviWet,
  description: '11_WetSeason_NDVI',
  folder: 'GIS_Portfolio', region: studyArea, scale: 10, maxPixels: 1e9
});

// 12 - NDVI Seasonal Change (Wet minus Dry)
Export.image.toDrive({
  image: ndviDiff,
  description: '12_Seasonal_NDVI_Change_WetMinusDry',
  folder: 'GIS_Portfolio', region: studyArea, scale: 10, maxPixels: 1e9
});

// 13 - Reference Land Cover (ESA WorldCover, reclassified to our 5 classes)
Export.image.toDrive({
  image: refClasses,
  description: '13_Reference_ESA_WorldCover_Reclassified',
  folder: 'GIS_Portfolio', region: studyArea, scale: 10, maxPixels: 1e9
});

// 14 - Automated Training Points (vector, useful to show methodology)
Export.table.toDrive({
  collection: autoTrainingSet,
  description: '14_AutomatedTrainingPoints',
  folder: 'GIS_Portfolio',
  fileFormat: 'SHP'
});

// 15 - FINAL LULC Classification (Random Forest, combined training)
Export.image.toDrive({
  image: classified,
  description: '15_FINAL_LULC_Classification_2024',
  folder: 'GIS_Portfolio', region: studyArea, scale: 10, maxPixels: 1e9
});

//==================================
// 12. Area Calculation per Class (km² and Percentage) - Batch Export Version
//==================================
// Computing this via Export (not print) avoids the interactive Console's
// timeout entirely - batch tasks run on Google's backend with no such limit,
// so we keep full 10m accuracy with tileScale for efficient computation,
// but NO bestEffort (which would reduce accuracy) - nothing is compromised.
var classNames = ['Water', 'Vegetation', 'Agriculture', 'Bare Soil', 'Built-up'];

var pixelAreaImage = ee.Image.pixelArea().addBands(classified);

var areaStats = pixelAreaImage.reduceRegion({
  reducer: ee.Reducer.sum().group({groupField: 1, groupName: 'class'}),
  geometry: studyArea,
  scale: 10,
  maxPixels: 1e10,
  tileScale: 16
  // no bestEffort - full 10m accuracy preserved, this now runs as a batch task
});

var groups = ee.List(areaStats.get('groups'));

var areaFeatures = ee.FeatureCollection(groups.map(function(g) {
  g = ee.Dictionary(g);
  var classNum = ee.Number(g.get('class'));
  var areaM2 = ee.Number(g.get('sum'));
  var areaKm2 = areaM2.divide(1e6);
  return ee.Feature(null, {
    class: classNum,
    className: ee.List(classNames).get(classNum),
    area_km2: areaKm2
  });
}));

var totalAreaKm2 = areaFeatures.aggregate_sum('area_km2');

var areaFeaturesWithPct = areaFeatures.map(function(f) {
  var pct = ee.Number(f.get('area_km2')).divide(totalAreaKm2).multiply(100);
  return f.set('percentage', pct).set('total_area_km2', totalAreaKm2);
});

// Export the results as a CSV task instead of printing to Console -
// this is what avoids the timeout, since it runs as a background batch job
Export.table.toDrive({
  collection: areaFeaturesWithPct,
  description: '16_LULC_Area_Statistics',
  folder: 'GIS_Portfolio',
  fileFormat: 'CSV'
});

//==================================
// 13a. Legend on the Map
//==================================
var legend = ui.Panel({
  style: {position: 'bottom-left', padding: '8px 15px', backgroundColor: 'white'}
});

var legendTitle = ui.Label('LULC Classes', {fontWeight: 'bold', fontSize: '14px', margin: '0 0 4px 0'});
legend.add(legendTitle);

var legendColors = ['#0000FF', '#00FF00', '#FFFF00', '#D2B48C', '#FF0000'];

var makeLegendRow = function(color, name) {
  var colorBox = ui.Label('', {
    backgroundColor: color, padding: '8px', margin: '0 0 4px 0'
  });
  var description = ui.Label(name, {margin: '0 0 4px 6px'});
  return ui.Panel({
    widgets: [colorBox, description],
    layout: ui.Panel.Layout.Flow('horizontal')
  });
};

for (var i = 0; i < classNames.length; i++) {
  legend.add(makeLegendRow(legendColors[i], classNames[i]));
}

Map.add(legend);
