`ogr2ogr -f GeoJSON world.json ne_50m_admin_0_countries.shp`

`topojson --id-property ISO_A3 -p nameEn=NAME_EN,name=NAME,abbr=NAME_SHORT,formalName=FORMAL_EN,nameAlt=NAME_ALT,isocode=ISO_A2,isocode3=ISO_A3 -o world-topo-110m.json world.json`
