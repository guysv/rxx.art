# Favicon assets

The favicons use the original handmade `www/rxx.png` in full, including its
lettering, sparkles, palette, brush, and border. No generated artwork is used.
The original logo files are unchanged.

`www/favicon-16x16.png`, `www/favicon-32x32.png`, and
`www/favicon-48x48.png` are filtered size conversions of that 64×64 original,
selected after comparing nearest-neighbor, RotSprite, and filtered exports.
Filtering softens pixel edges while retaining more of the overall logo at tab
sizes. The complete human artwork is retained without redrawing or cropping.

Regenerate each PNG on macOS with `sips -z N N www/rxx.png --out
www/favicon-NxN.png`, replacing each `N` with 16, 32, or 48. Rebuild the ICO from
those PNGs whenever they change.

`www/favicon.ico` embeds those three PNGs. All four HTML pages reference the same
assets with relative URLs, following the existing static asset workflow.
