import { getFileFromRequest, getImporterByFileName } from './utils.js';

export const importHandler = async (request, response, context) => {
    const file = getFileFromRequest(request);
    const importer = getImporterByFileName(file.name);
    const buffer = await request.body.file.toBuffer();
    const content = buffer.toString();
    await importer(content, context.resource);
    return {};
};
