# Project02_Municipal_Zoning_Digitization_Georeferencing

A multi-city series applying the same core GIS workflow — raster georeferencing
and manual vector digitization — to real municipal zoning maps across six
U.S. towns, cities, and villages. Each source document arrived as a flat
scanned image (PDF or JPEG) with no embedded coordinate reference system;
each was georeferenced, digitized into a topologically clean vector layer,
attributed against the jurisdiction's actual zoning ordinance, and produced
as a final cartographic map.

## Case Studies in This Series

| # | Jurisdiction | State | Folder |
|:-:|--------------|:-----:|--------|
| 01 | (/01-NY_Village_of_Franklinville) | NY | `01-NY-Village_of_Franklinville` |
| 02 | City of Simpsonville | SC | `02-SC_City_of_Simpsonville` |
| 03 | Town of Fyffe | AL | `03-AL_Town_of_Fyffe` |
| 04 | City of Pekin | IL | `04-IL_City_of_Pekin` |
| 05 | Town of Summerville | SC | `05-SC_Town_of_Summerville` |
| 06 | City of Shawnee | OK | `06-OK_City_of_Shawnee` |

Each subfolder is a self-contained case study with its own **README.md** documenting:

- Zoning ordinance source
- Coordinate Reference System (CRS) / UTM Zone
- Georeferencing control points (GCPs)
- Digitized feature count
- Zoning classifications and results

## Common workflow across all five

1. **CRS determination** — locate the jurisdiction via Google Maps, then use
   Google Earth Pro (UTM coordinates enabled in Preferences) to identify the
   correct UTM zone for the area.
2. **Georeferencing** — align the scanned source (PDF/JPEG) to a Google
   Satellite XYZ basemap in QGIS Georeferencer using 3-6 GCPs and a
   linear or polynomial transformation, exporting a georeferenced GeoTIFF.
3. **Digitization** — create a new GeoPackage (MultiPolygon) layer and
   digitize zoning boundaries using the split tool, ring tool, snapping along,
   with topology checking and tracing enabled, and vertex editing.
4. **Ordinance research & attribution** — research the jurisdiction's zoning
   ordinance to correctly attribute each polygon with `zone_code` and
   `zone_name`, alongside state/town identifiers.
5. **Symbology & output** — apply categorized symbology by `zone_code` and
   export a final print-quality map with legend, title, north arrow and scale bar.

## Repository structure

```
Project02_Municipal_Zoning_Digitization_Georeferencing/
├── README.md                              (this file)
├── 01-NY-Village_of_Franklinville/
│   ├── georeferencing/
│   ├── images/
│   ├── outputs/
│   ├── source/
│   ├── vector/
│   └── README.md
├── 02-SC_City_of_Simpsonville/
├── 03-AL_Town_of_Fyffe/
├── 04-IL_City_of_Pekin/
└── 05-SC_Town_of_Summerville/
└── 06-OK_City_of_Shawnee/
```
## Reproducing this workflow with the provided data

Every case study in this series follows the same file layout, so the same
steps reproduce any of them — just swap the city folder. Using
`01-village_of_franklinville` as the example:

1. **Open QGIS** and add a live satellite basemap: right-click
   **XYZ Tiles → New Connection** in the Browser panel, name it
   `Google Satellite`, and paste this URL:
   `https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}`
   Double-click the new connection to load it into the map canvas.

2. **Open the original source file** from that city's `source/` folder
   (PDF or JPEG — georeferenced or not) and drag it onto the canvas. If it
   has no CRS, it will either fail to place correctly or land somewhere
   arbitrary relative to the basemap — that's expected at this stage.

3. **Georeference it yourself**, or skip straight to the pre-georeferenced
   result — both are provided:
   - *To redo the georeferencing:* open **Raster → Georeferencer**, load
     the raster from `source/`, then **File → Load GCP Points** and select
     the `.points` file from that city's `georeferencing/` folder. Set the
     transformation type shown in that project's README (Polynomial 1 or
     linear, depending on the case study), and run it. Watch where the
     raster lands relative to the Google Satellite basemap — it should snap
     into place over the real city.
   - *Or, faster:* just drag and drop the already-georeferenced raster
     (the `_modified.tif` file, also in `georeferencing/`) straight onto
     the canvas — QGIS will place it correctly using its embedded CRS.

4. **Add the vector layer**: drag and drop the `.gpkg` file from that
   city's `vector/` folder onto the canvas.

5. **Apply the styling**: right-click the layer → **Properties → Symbology
   → Style (bottom-left) → Load Style**, select the `.qml` file from the
   same `vector/` folder, and click **Apply**. The categorized zoning colors
   and legend labels will load instantly.

6. **Explore the data**: open the **Attribute Table** to see every polygon's
   `zone_code`, `zone_name`, and other fields, or use the **Identify
   Features** tool and click any polygon on the map to inspect it
   individually.

That's the full loop — from a flat scanned image to a styled, attributed,
explorable zoning layer. Each city's `images/` folder has reference
screenshots of the actual workflow steps (attribute table, digitizing,
georeferencing settings, symbology), and each `outputs/` folder has the
final exported map for a quick look without opening QGIS at all.

## Tools & skills demonstrated across the series
QGIS Georeferencer · GCP collection & coordinate system determination ·
Polynomial/linear transformations · Topological vector digitization
(split/ring/snapping tools) · GeoPackage data modeling · Municipal zoning
ordinance research · Categorized cartographic symbology · Print layout
composition
