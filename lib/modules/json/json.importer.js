import { saveRecords } from '../../utils.js';
export const jsonImporter = async (jsonString, resource) => {
    const records = JSON.parse(jsonString);
    return saveRecords(records, resource);
};
