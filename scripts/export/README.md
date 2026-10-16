# Website model catalogue

`export_catalog.py` makes web-only GLBs from the supplied Blender documents. It
does not save or modify those documents. The chosen Art Toy source is specifically
`Art toy Cenematic/Orange_Ocean_Atelier_v5_Final.blend`; the Clarity v6 lighting
variant and `.blend1` backups are intentionally not separate catalogue items.

## Rebuild

Run with Blender 5.2 or newer from the website directory:

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b -t 4 --python scripts/export/export_catalog.py
/Applications/Blender.app/Contents/MacOS/Blender -b -t 4 --python scripts/export/validate_catalog.py
```

To export one model, append `-- marun`, or another catalogue ID.

## Export decisions

- Keep every render-visible booth component, including floors, furniture, signs,
  rigging, stairs, mezzanines and glazed rooms. Omit cameras, lights and the large
  studio/exhibition-hall surroundings. Art Toy omits the shopping-mall environment.
- Keep all four Korea pavilion blocks and both parts of the Italy pavilion.
- Center each footprint on the origin, with its ground at zero. GLBs use metres
  and Y up. `*-export.json` records the exported bounds.
- Cap render subdivisions and reduce excessively tessellated curved meshes;
  retain the architectural composition and all individual booth parts.
- Bake procedural base-color swatches into textures. These preserve source color
  and patterns for web viewing, with generated surface UVs; they do not reproduce
  Cycles' procedural normals or studio illumination exactly. Glazing uses a light
  alpha blend so interior details remain readable with browser lighting.
- Assign explicit UV channel names before joining meshes. Authored graphics use
  `WebOriginalUV`; baked procedural colors use `WebSurfaceUV`.
- Join meshes, retain material groups, embed the images, compress geometry with
  Draco, and use JPEG for opaque textures while preserving alpha textures as PNG.

## Runtime and checks

`lib/model-catalog.ts` is the runtime metadata and camera-preset registry. It also
reuses the existing HILONG/JIULI assets. The original `exhibition-models.ts` remains
unchanged for the existing homepage/About experiences.

The local Draco decoder is in `public/models/catalog/draco/`. Configure the
model-viewer class's `dracoDecoderLocation` to `/models/catalog/draco/` before
loading these GLBs; no external decoder host is required.

`validate_catalog.py` checks GLB headers and embedded image references, round-trips
each file through the Draco decoder, measures mesh bounds, and renders independent
visual QA thumbnails. The results are saved in `review/validation.json` and
`review/*.png`. These thumbnails are QA only, not website cover/gallery images.
