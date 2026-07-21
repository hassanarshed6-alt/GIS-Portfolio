# 🗺️ Project 1: Land Use Land Cover Classification — Jhelum District, Pakistan

A supervised remote sensing classification of Jhelum District, Punjab, Pakistan into five land cover classes, built entirely in Google Earth Engine using Sentinel-2 imagery, a hybrid training strategy, and a Random Forest classifier — refined through iterative, diagnosed improvements to spectral confusion.

📄 [Full Project Documentation (PDF)](./report/Jhelum_LULC_Project_Documentation.pdf) &nbsp;|&nbsp; 💻 [GEE Script](./code/lulc_classification_gee.js)

---

## 📍 Study Area

**Jhelum District, Punjab, Pakistan** — bounded by the Jhelum River, spanning **3,616.12 km²** of mixed urban, agricultural, and riverine terrain.

## 🎯 Objective

Classify the district into five land cover categories — **Water, Vegetation, Agriculture, Bare Soil, and Built-up** — using freely available satellite imagery, in the absence of field survey data, while maintaining a methodologically defensible accuracy assessment.

## 🛰️ Data Sources

| Dataset | Source | Purpose |
|---|---|---|
| Sentinel-2 Level-2A (Harmonized) | Copernicus/ESA via GEE | Primary multispectral imagery (dry + wet season composites) |
| ESA WorldCover v200 | European Space Agency | Automated training/reference labels (reclassified to 5-class schema) |
| FAO GAUL Level 2 | FAO | District & country boundary delineation |
| Manually digitized polygons | Author (GEE Code Editor) | Independent training & validation samples |

## 🧠 Methodology

1. **Preprocessing** — Cloud/cirrus-masked Sentinel-2 composites built for two seasons:
   - Dry season: 1 Jan – 31 May 2024 (46 scenes, <5% cloud filter)
   - Wet season: 1 Jul – 30 Sep 2024 (<30% cloud filter, relaxed for monsoon climate)
2. **Feature engineering** — 13 input features: 6 raw bands, NDVI, NDWI, NDBI, Brightness, wet-season NDVI, seasonal NDVI change, and GLCM texture (contrast).
3. **Hybrid training data** — Combined automated stratified sampling (12,500 pts from reclassified WorldCover) with manually digitized, expert-verified polygons (capped/balanced per class to avoid source dominance).
4. **Classification** — Random Forest (300 trees), trained on the combined dataset.
5. **Dual accuracy assessment** — (A) an automated, whole-district independent test set, and (B) a spatially separate, manually validated set — avoiding the spatial-autocorrelation bias common in single-source accuracy reporting.
6. **Iterative refinement** — Diagnosed persistent Bare Soil ↔ Built-up ↔ Agriculture confusion via confusion matrix inspection; resolved primarily by adding a GLCM texture feature, which reduced this confusion by 37–70% across both accuracy checks.

## 📊 Results

| Assessment | Overall Accuracy | Kappa | Interpretation |
|---|---|---|---|
| (A) Automated, whole-district | **77.15%** | 0.7144 | Substantial agreement |
| (B) Independent manual validation | **92.35%** | 0.9009 | Almost perfect agreement |

**Land cover distribution:**

| Class | Area (km²) | % of District |
|---|---|---|
| 🟦 Water | 124.13 | 3.43% |
| 🟩 Vegetation | 1,304.63 | 36.08% |
| 🟨 Agriculture | 1,357.48 | 37.54% |
| 🟫 Bare Soil | 522.32 | 14.44% |
| 🟥 Built-up | 307.56 | 8.51% |

<p float="left">
  <img src="./layers/charts/pie_chart.png" width="45%" />
  <img src="./layers/charts/bar_chart.png" width="45%" />
</p>

## 🗺️ Final Classification Map

![Final LULC Classification Map](./maps/final_classification_map.png)

*Includes classified raster, legend, scale bar, north arrow, and a Pakistan-wide locator inset.*

## 🔍 Supporting Layers

<table>
<tr>
<td><img src="./layers/03_dry_composite_truecolor.png" width="100%"/><br/><sub>Dry Season True Color</sub></td>
<td><img src="./layers/04_dry_composite_falsecolor.png" width="100%"/><br/><sub>Dry Season False Color</sub></td>
<td><img src="./layers/09_wet_composite_truecolor.png" width="100%"/><br/><sub>Wet Season True Color</sub></td>
</tr>
<tr>
<td><img src="./layers/05_dry_ndvi.png" width="100%"/><br/><sub>NDVI (Dry Season)</sub></td>
<td><img src="./layers/06_dry_ndwi.png" width="100%"/><br/><sub>NDWI (Water Index)</sub></td>
<td><img src="./layers/07_dry_ndbi.png" width="100%"/><br/><sub>NDBI (Built-up Index)</sub></td>
</tr>
<tr>
<td><img src="./layers/11_seasonal_ndvi_change.png" width="100%"/><br/><sub>Seasonal NDVI Change</sub></td>
<td><img src="./layers/12_texture_glcm.png" width="100%"/><br/><sub>GLCM Texture (Contrast)</sub></td>
<td><img src="./layers/13_reference_worldcover.png" width="100%"/><br/><sub>Reference: ESA WorldCover</sub></td>
</tr>
</table>

## 🛠️ Tools & Technologies

`Google Earth Engine (JavaScript API)` · `Sentinel-2` · `ESA WorldCover` · `Random Forest` · `QGIS` · `GLCM Texture Analysis`

## 📁 Repository Contents
