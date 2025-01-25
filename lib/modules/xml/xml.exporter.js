import xml from 'xml';
export const xmlExporter = (records) => {
    const data = records.map(record => ({
        record: Object.entries(record.params).map(([key, value]) => ({
            [key]: value,
        })),
    }));
    return xml({ records: data }, {
        indent: '\t',
        declaration: true,
    });
};
