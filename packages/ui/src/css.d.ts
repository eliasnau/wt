/**
 * Side-effect stylesheet imports — e.g. `import "maplibre-gl/dist/maplibre-gl.css"`
 * in `components/ui/map.tsx`. The bundler resolves these; TypeScript has no
 * declaration for them and raises TS2882 ("cannot find module or type
 * declarations for side-effect import") without this.
 */
declare module "*.css";
