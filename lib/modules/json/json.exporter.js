export const jsonExporter = (records) => {
    return JSON.stringify(records.map(r => ({ params: r.params, relations: r.relations })));
};
