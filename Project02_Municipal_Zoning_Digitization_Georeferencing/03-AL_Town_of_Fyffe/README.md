# 03 — Town of Fyffe, AL: Zoning Map Digitization

Digitization of the Town of Fyffe's **DRAFT Official Zoning Map**
(prepared by TARCOG — Top of Alabama Regional Council of Governments). This
source PDF was already georeferenced when loaded into QGIS, so — like
Simpsonville — this case study skips the manual GCP/Georeferencer stage
entirely and goes straight from source PDF to digitized, attributed vector
layer.

![Final digitized zoning map of Fyffe, AL](outputs/al_town_of_fyffe_1__final_image.png)

## Project summary

| | |
|---|---|
| **Location** | Town of Fyffe, DeKalb County, Alabama, USA |
| **Source document** | *DRAFT Official Zoning Map for the Town of Fyffe* (TARCOG, June 21, 2021), PDF |
| **Georeferencing** | None required — PDF loaded already georeferenced |
| **Layer CRS** | ESRI:102629 — NAD 1983 StatePlane Alabama East FIPS 0101 (Feet) |
| **Digitized features** | 5 polygons across 5 zoning classes |
| **Software** | QGIS (Digitizing toolbar, Symbology) |

---

## Step 1 — Load the source PDF directly

The DRAFT zoning map PDF opened already georeferenced, placing it correctly
over Fyffe's real-world location without any GCP collection needed. I
verified the alignment against ESRI Satellite imagery (added via **XYZ
Tiles**, using the built-in ESRI Satellite connection this time rather than
Google's) before beginning digitization.

## Step 2 — Digitize zoning boundaries

I created a new **GeoPackage** layer (`vector/al_town_of_fyffe_1_.gpkg`)
with **MultiPolygon** geometry, and digitized directly over the loaded PDF
using the same boundary-trace-then-split-and-ring method as the rest of
this series:

1. **Boundary tracing** — drew the Fyffe town limit first as a single large
   polygon, following the dashed "Fyffe Town Limits" outline shown on the
   source map.
2. **Split tool** — divided the town boundary into individual zoning areas
   by drawing split lines along the zone boundaries visible in the source
   PDF (the B-1, B-2, I-1, and "Unknown" pockets sitting inside the larger
   R-1 area).
3. **Ring tool** — used for the small zoning pockets that sit entirely
   inside the R-1 boundary, where a split line would otherwise have to exit
   the parent shape.
4. **Snapping + topology checking + tracing** — kept all three enabled
   throughout so adjacent polygon edges matched exactly, avoiding slivers,
   gaps, or overlaps.
5. **Vertex tool** — used to fine-tune vertices where a boundary needed to
   hug the source PDF's shading more precisely.

![Digitizing zoning polygons directly over the georeferenced source PDF](images/3_Digitization.png)

## Step 3 — Attribute each feature

Each polygon's zone code was matched directly against the source map's
legend, then cross-checked where possible for the official district name.
Each of the 5 polygons was attributed with:

| Field | Description |
|---|---|
| `fid` | Auto-generated GeoPackage feature ID |
| `ID` | Sequential feature identifier |
| `zone_code` | Zoning code as shown in the source map's legend (e.g. `B-1`, `R-1`) |
| `zone_name` | Full district name where available |

![Populated attribute table showing zone_code and zone_name for all 5 features](images/2_Attribute_Table.png)

**Zoning classification results:**

| Zone Code | District Name | Feature Count |
|---|---|---|
| B-1 | Neighborhood Trade District | 1 |
| B-2 | General Business District | 1 |
| I-1 | *(code only — no descriptive name on source map)* | 1 |
| R-1 | Residential District | 1 |
| Unknown | Unknown *(unzoned pocket, per the source map's own legend)* | 1 |
| **Total** | | **5** |

## Step 4 — Symbolize and export the final map

1. Opened **Layer Properties → Symbology**, set the renderer to
   **Categorized**, and set the classification field to `zone_code`.
2. Clicked **Classify** to auto-generate one symbol per unique zone code,
   matching each color to the source map's own legend colors for visual
   consistency with the original DRAFT map.
3. Saved the styling separately as `vector/al_town_of_fyffe_styling.qml`.
4. Composited the styled layer over satellite imagery and exported the
   final map as `outputs/al_town_of_fyffe_1__final_image.png`.

![Categorized symbology configuration by zone_code, matched to the source legend](images/1_Symbology.png)

---

## Repository contents

```
03-al_town_of_fyffe/
├── source/            # Original DRAFT zoning map (already georeferenced PDF)
│   └── 2021_Fyffe_Zoning_Map__1_.pdf
├── vector/             # Final GeoPackage + QGIS style file
│   ├── al_town_of_fyffe_1_.gpkg
│   └── al_town_of_fyffe_styling.qml
├── outputs/            # Final cartographed map (PNG)
│   └── al_town_of_fyffe_1__final_image.png
├── images/             # Workflow screenshots referenced in this README
└── README.md
```

## Tools & skills demonstrated
QGIS digitizing toolbar (boundary tracing, split, ring, snapping, topology
checking, vertex editing) · GeoPackage data modeling · source-legend-based
attribute classification · categorized cartographic symbology matched to a
published reference map
