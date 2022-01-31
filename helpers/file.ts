import path from 'path';
import getConfig from 'next/config';

const getPath = (file: string) =>
  path.join(getConfig().serverRuntimeConfig.PROJECT_ROOT, file);

export default getPath;
