import { jsonExporter } from './modules/json/json.exporter.js';
import { jsonImporter } from './modules/json/json.importer.js';
export const Parsers = {
    json: { export: jsonExporter, import: jsonImporter },
};
