import { Filter } from "adminjs";

export default {
    Import: {
        label: "Import",
        component: 'ImportPageComponent',
        handler: async (request, response, context) => {
            const { _decorated } = context._admin.resources
                .find(({ _decorated }) => _decorated.actions.import && _decorated.options.navigation);
            return {
                resource: { id: _decorated.id() },
            };
        },
    },
    Export: {
        label: "Export",
        handler: async (request, response, context) => {
          const { startDate, endDate, findResources } = request.query;
          const resourceList = context._admin.resources
            .filter(({ _decorated }) => _decorated.actions.export && _decorated.options.navigation)
            .map(({ MongooseModel }) => MongooseModel.modelName);
          const findResourcesParsed = JSON.parse(findResources);
          const resources = context._admin.resources.filter(({
            _decorated,
            MongooseModel
          }) => findResourcesParsed[0] === 'All' ? (_decorated.actions.export && _decorated.options.navigation) : findResourcesParsed.includes(MongooseModel.modelName));
          const records = (await Promise.all(resources.map(async resource => {
            const records = await resource.find(new Filter({
              'updatedAt~~from': startDate,
              'updatedAt~~to': endDate,
            }, resource), {
              limit: Number.MAX_SAFE_INTEGER,
              sort: {
                sortBy: 'updatedAt',
                direction: 'desc',
              },
            });
            return await Promise.all(records.map(async record => {
              const relations = Object.entries(resource._decorated?.properties['relations']?.options?.props?.relations || {});
              if (!relations || !relations.length) {
                return {
                  resourceId: resource.MongooseModel.modelName,
                  params: record.params,
                };
              }
              const idProperty = resource.properties().find(p => p.isId())?.name?.();
              const titleProperty = resource.decorate().titleProperty()?.name?.();
              await Promise.all(relations.map(async ([, value]) => {
                const relationResource = await context._admin.resources.find(resource => resource.id() === value.target.resourceId);
                if (relationResource) {
                  const relationRecords = await relationResource.find(new Filter({}, relationResource), {
                    limit: Number.MAX_SAFE_INTEGER,
                    sort: {
                      sortBy: idProperty ?? titleProperty,
                      direction: 'desc',
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
                      record.relations = [{
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
                      }];
                    }
                  }
                  if (value.type === 'one-to-many') {
                    const pivotResource = await context._admin.resources.find(resource => resource.id() === value.target.resourceId);
                    if (pivotResource) {
                      const pivotRecords = await pivotResource.find(new Filter({}, pivotResource), {
                        limit: Number.MAX_SAFE_INTEGER,
                        sort: {
                          sortBy: 'updatedAt',
                          direction: 'desc',
                        },
                      });
                      record.relations = [{
                        relation: value,
                        records: pivotRecords.reduce((acc, pivotRecord) => {
                          if (pivotRecord.params[value.target.joinKey] === record.params._id) {
                            acc.push({
                              record: pivotRecord.params,
                            });
                          }
                          return acc;
                        }, [])
                      }];
                    }
                  }
                }
              }));
              return {
                resourceId: resource.MongooseModel.modelName,
                params: record.params,
                relations: record.relations,
              }
            }));

          }))).filter(record => record.length).flat().reduce((acc, record) => {
            const { resourceId, params, relations } = record;
            if (!acc[resourceId]) {
              acc[resourceId] = [];
            }
            acc[resourceId].push({ resourceId, params, relations });
            return acc;
          }, {});

          return {
            resourceList,
            records,
          };
        },
        component: 'ExportPageComponent',
      },
}