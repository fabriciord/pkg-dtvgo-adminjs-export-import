import { parse } from 'json2csv';
export const csvExporter = (records) => {
    return parse(records.map(r => r.params));
};
