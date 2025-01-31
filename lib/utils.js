import { Filter, NotFoundError, ValidationError, } from 'adminjs';
import { jsonImporter } from './modules/json/json.importer.js';

async function findResourceById(adminResources, resourceId) {
    return adminResources.find(resource => resource.id() === resourceId);
}
async function findOne(resource, filter) {
    const results = await resource.find(new Filter(filter, resource), {
        limit: 1,
        sort: { sortBy: '_id', direction: 'asc' }
    });
    return results && results.length ? results[0] : null;
}
async function createOrUpdateResource(request, replay, context, resource, data) {
    const existentRecord = await findOne(resource, { _id: data._id });
    if (!existentRecord) {
        return resource._decorated.actions.new.handler({
            ...request,
            payload: data,
            params: {
                resourceId: resource.MongooseModel.modelName,
                recordId: data._id,
                action: resource._decorated.actions.new.name,
              }
        }, replay, {
            ...context,
            resource,
            _admin: context._admin,
            currentAdmin: context.currentAdmin,
        });
    } else {
        return resource._decorated.actions.edit.handler({
            ...request,
            payload: data,
            params: {
                resourceId: resource.MongooseModel.modelName,
                recordId: data._id,
                action: resource._decorated.actions.edit.name,
              }
        }, replay, {
            ...context,
            resource,
            _admin: context._admin,
            currentAdmin: context.currentAdmin,
            record: existentRecord,
        });
    }
}
async function processManyToManyRelation(adminResources, relation, relationRecord) {
    const pivotResource = await findResourceById(adminResources, relation.relation.junction.throughResourceId);
    if (!pivotResource) return;

    const pivotData = relationRecord.pivotRecord;
    await createOrUpdateResource(request, response, context, pivotResource, pivotData);

    const targetResource = await findResourceById(adminResources, relation.relation.target.resourceId);
    if (!targetResource) return;

    const targetData = relationRecord.record;
    await createOrUpdateResource(request, response, context, targetResource, targetData);
}
async function processRelation(adminResources, relation) {
    const relationResource = await findResourceById(adminResources, relation.relation.target.resourceId);
    if (!relationResource) return;

    if (relation.relation.type === 'many-to-many') {
        await Promise.all(relation.records.map(rr => processManyToManyRelation(adminResources, relation, rr)));
    } else {

    }
}
async function processRecord(request, response, context, record, adminResources) {
    try {
        const resource = adminResources.find(({ MongooseModel }) => MongooseModel.modelName === record.resourceId)
        const data = record.params;
        await createOrUpdateResource(request, response, context, resource, data);

        if (record.relations) {
            await Promise.all(
                record.relations.map(relation => processRelation(adminResources, relation))
            );
        }

        return record;
    } catch (e) {
        console.error(e);
        return e;
    }
}
export const saveRecords = async (request, response, context, records) => {
    const adminResources = context.resource._decorated._admin.resources;
    return Promise.all(records.map(record => processRecord(request, response, context, record, adminResources)));
};
export const getImporterByFileName = (fileName) => {
    if (fileName.includes('.json')) {
        return jsonImporter;
    }
    throw new Error('No parser found');
};
export const postActionHandler = (handler, type) => async (request, response, context) => {
    if (request.method !== 'post' && type === 'export') {
        const {
            records,
        } = context;
        if (!records || !records.length) {
            throw new NotFoundError('no records were selected.', 'Action#handler');
        }
        const recordsInJSON = records.map(record => record.toJSON(context.currentAdmin));
        return {
            records: recordsInJSON
        };
    }
    return handler(request, response, context);
};
export const getFileFromRequest = (request) => {
    const file = request?.payload.file;
    if (!file) {
        throw new ValidationError({
            file: { message: 'No file uploaded' },
        });
    }
    return file;
};
export const getRecords = async (context, selectedRecords) => {
    const idProperty = context.resource
        .properties()
        .find(p => p.isId())
        ?.name?.();
    const titleProperty = context.resource.decorate().titleProperty()?.name?.();

    const records = (await context.resource.find(new Filter({}, context.resource), {
        limit: Number.MAX_SAFE_INTEGER,
        sort: {
            sortBy: idProperty ?? titleProperty,
            direction: 'asc',
        },
    })).filter(record => selectedRecords.includes(record.params._id));

    const relations = Object.entries(context.resource._decorated?.properties['relations']?.options?.props?.relations || {});

    if (!relations || !relations.length) {
        return records;
    }

    for (const [, value] of relations) {
        const relationResource = await context._admin.resources.find(resource => resource.id() === value.target.resourceId);

        if (relationResource) {
            const relationRecords = await relationResource.find(new Filter({}, relationResource), {
                limit: Number.MAX_SAFE_INTEGER,
                sort: {
                    sortBy: idProperty ?? titleProperty,
                    direction: 'asc',
                },
            });

            if (value.type === 'many-to-many') {
                const pivotResource = await context._admin.resources.find(resource => resource.id() === value.junction.throughResourceId);
                if (pivotResource) {
                    const pivotRecords = await pivotResource.find(new Filter({}, pivotResource), {
                        limit: Number.MAX_SAFE_INTEGER,
                        sort: {
                            sortBy: idProperty ?? titleProperty,
                            direction: 'asc',
                        },
                    });

                    for (const record of records) {
                        if (!record.relations) {
                            record.relations = [];
                        }

                        record.relations.push({
                            relation: value,
                            records: pivotRecords.reduce((acc, pivotRecord) => {
                                if (pivotRecord.params[value.junction.joinKey] === record.params._id) {
                                    acc.push({
                                        record: relationRecords.find(relationRecord => relationRecord.params._id === pivotRecord.params[value.junction.inverseJoinKey])?.params,
                                        pivotRecord: pivotRecord.params,
                                    });
                                }

                                return acc;
                            }, [])
                        });
                    }
                }
            }
            if (value.type === 'one-to-many') {
                const pivotResource = await context._admin.resources.find(resource => resource.id() === value.target.resourceId);
                if (pivotResource) {
                    const pivotRecords = await pivotResource.find(new Filter({}, pivotResource), {
                        limit: Number.MAX_SAFE_INTEGER,
                        sort: {
                            sortBy: idProperty ?? titleProperty,
                            direction: 'asc',
                        },
                    });
                    for (const record of records) {
                        if (!record.relations) {
                            record.relations = [];
                        }
                        record.relations.push({
                            relation: value,
                            records: pivotRecords.reduce((acc, pivotRecord) => {
                                if (pivotRecord.params[value.target.joinKey] === record.params._id) {
                                    acc.push({
                                        record: pivotRecord.params,
                                    });
                                }
                                return acc;
                            }, [])
                        });
                    }
                }
            }
        }
    }

    return records;
};
