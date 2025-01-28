import { Parsers } from './parsers.js';
import { getRecords } from './utils.js';
export const exportHandler = async (request, response, context) => {
    const parser = Parsers[request.query?.type ?? 'json'].export;
    const recordsData = await getRecords(context, request.body?.records);
    const parsedData = parser(recordsData);
    return {
        exportedData: parsedData,
    };
};
