import { saveRecords } from '../../utils.js';
export const jsonImporter = async (request, response, context, content) => {
    const records = JSON.parse(content);
    return saveRecords(request, response, context, records);
};
