import path from 'path';
import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
export const bundleComponent = (loader, componentName) => {
    const componentPath = path.join(__dirname, `./components/${componentName}`);
    return loader.add(componentName, componentPath);
};
