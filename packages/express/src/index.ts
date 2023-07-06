import { Generator } from 'basketry';
import { ExpressRouterFactory } from './express-factory';

export * from './types';

const generate: Generator = (service, options) => {
  return new ExpressRouterFactory(service, options).build();
};

export default generate;
