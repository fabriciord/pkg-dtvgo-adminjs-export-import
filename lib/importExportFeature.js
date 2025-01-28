import { buildFeature } from 'adminjs';
import { postActionHandler } from './utils.js';
import { exportHandler } from './export.handler.js';
import { importHandler } from './import.handler.js';
import { bundleComponent } from './bundle-component.js';
const importExportFeature = (options) => {
    const { componentLoader } = options;
    const importComponent = bundleComponent(componentLoader, 'ImportComponent');
    const exportComponent = bundleComponent(componentLoader, 'ExportComponent');
    return buildFeature({
        actions: {
            export: {
                handler: postActionHandler(exportHandler, 'export'),
                component: exportComponent,
                actionType: 'bulk',
                icon: 'Share',
                showInDrawer: false,
            },
            import: {
                handler: postActionHandler(importHandler, 'import'),
                component: importComponent,
                actionType: 'resource',
            },
        },
    });
};
export default importExportFeature;
