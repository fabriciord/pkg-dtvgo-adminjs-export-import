export const jsonExporter = (records) => {
    return JSON.stringify(records.map(record => ({
        resourceId: record.resource.MongooseModel.modelName,
        params: record.params,
        relations: record.relations
    })));
};
