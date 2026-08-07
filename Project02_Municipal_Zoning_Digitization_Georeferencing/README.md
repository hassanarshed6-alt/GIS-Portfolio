# Project 16: Municipal Zoning Digitization & Georeferencing

A multi-city series applying the same core GIS workflow — raster georeferencing
and manual vector digitization — to real municipal zoning maps across six
U.S. towns, cities, and villages. Each source document arrived as a flat
scanned image (PDF or JPEG) with no embedded coordinate reference system;
each was georeferenced, digitized into a topologically clean vector layer,
attributed against the jurisdiction's actual zoning ordinance, and produced
as a final cartographic map.

## Case studies in this series

| # | Jurisdiction | State | Folder |
|---|---|---|---|---|
| 01 | Village of Franklinville | NY | `01-NY-Village_of_Franklinville` 
| 02 | City of Simpsonville | SC | `02-SC_City_of_Simpsonville` 
| 03 | Town of Fyffe | AL | `03-AL_Town_of_Fyffe` 
| 04 | City of Pekin | IL | `04-IL_City_of_Pekin` 
| 05 | Town of Summerville | SC | `05-SC_Town_of_Summerville` 
| 06 | City of Shawnee | OK | `06-OK_City_of_Shawnee` 
Each subfolder is a self-contained case study with its own README covering
that jurisdiction's specific ordinance, CRS/UTM zone, GCP count, feature
count, and zoning classification results.

## Common workflow across all five

1. **CRS determination** — locate the jurisdiction via Google Maps, then use
   Google Earth Pro (UTM coordinates enabled in Preferences) to identify the
   correct UTM zone for the area.
2. **Georeferencing** — align the scanned source (PDF/JPEG) to a Google
   Satellite XYZ basemap in QGIS Georeferencer using 3-6 GCPs and a
   linear or polynomial transformation, exporting a georeferenced GeoTIFF.
3. **Digitization** — create a new GeoPackage (MultiPolygon) layer and
   digitize zoning boundaries using the split tool, ring tool, snapping,
   topology checking, and vertex editing.
4. **Ordinance research & attribution** — research the jurisdiction's zoning
   ordinance to correctly attribute each polygon with `zone_code` and
   `zone_name`, alongside state/town identifiers.
5. **Symbology & output** — apply categorized symbology by `zone_code` and
   export a final print-quality map with legend, title, and scale bar.

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

## Tools & skills demonstrated across the series
QGIS Georeferencer · GCP collection & coordinate system determination ·
Polynomial/linear transformations · Topological vector digitization
(split/ring/snapping tools) · GeoPackage data modeling · Municipal zoning
ordinance research · Categorized cartographic symbology · Print layout
composition
