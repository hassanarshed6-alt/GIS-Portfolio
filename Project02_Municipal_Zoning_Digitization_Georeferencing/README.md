# Project 16: Municipal Zoning Digitization & Georeferencing

A multi-city series applying the same core GIS workflow — raster georeferencing
and manual vector digitization — to real municipal zoning maps across five
U.S. towns, cities, and villages. Each source document arrived as a flat
scanned image (PDF or JPEG) with no embedded coordinate reference system;
each was georeferenced, digitized into a topologically clean vector layer,
attributed against the jurisdiction's actual zoning ordinance, and produced
as a final cartographic map.

## Case studies in this series

| # | Jurisdiction | State | Folder | Status |
|---|---|---|---|---|
| 01 | Village of Franklinville | NY | `01-village_of_franklinville` | ✅ Complete |
| 02 | City of Simpsonville | SC | `02-sc_city_of_simpsonville` | ⬜ Pending |
| 03 | Town of Fyffe | AL | `03-al_town_of_fyffe` | ⬜ Pending |
| 04 | City of Pekin | IL | `04-il_city_of_pekin` | ⬜ Pending |
| 05 | Summerville | SC | `05-sc_summerville` | ⬜ Pending |

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
16-municipal-zoning-digitization-georeferencing/
├── README.md                              (this file)
├── 01-village_of_franklinville/
│   ├── data/{source, georeferencing, vector}/
│   ├── outputs/
│   ├── images/
│   └── README.md
├── 02-sc_city_of_simpsonville/
├── 03-al_town_of_fyffe/
├── 04-il_city_of_pekin/
└── 05-sc_summerville/
```

## Tools & skills demonstrated across the series
QGIS Georeferencer · GCP collection & coordinate system determination ·
Polynomial/linear transformations · Topological vector digitization
(split/ring/snapping tools) · GeoPackage data modeling · Municipal zoning
ordinance research · Categorized cartographic symbology · Print layout
composition
