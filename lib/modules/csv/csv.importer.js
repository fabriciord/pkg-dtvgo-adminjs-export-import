import csv from 'csvtojson';
import { saveRecords } from '../../utils.js';
export const csvImporter = async (csvString, resource) => {
    const records = await csv().fromString(csvString);
    return saveRecords(records, resource);
};
