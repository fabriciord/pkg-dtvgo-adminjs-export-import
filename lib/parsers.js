import { jsonExporter } from './modules/json/json.exporter.js';
import { jsonImporter } from './modules/json/json.importer.js';
import { csvExporter } from './modules/csv/csv.exporter.js';
import { xmlExporter } from './modules/xml/xml.exporter.js';
import { csvImporter } from './modules/csv/csv.importer.js';
import { xmlImporter } from './modules/xml/xml.importer.js';
export const Parsers = {
    json: { export: jsonExporter, import: jsonImporter },
    csv: { export: csvExporter, import: csvImporter },
    xml: { export: xmlExporter, import: xmlImporter },
};
