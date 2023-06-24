import { Generator } from 'basketry';
import { ExpressRouterFactory } from './express-factory';

const generate: Generator = (service, options) => {
  return new ExpressRouterFactory().build(service, options);
};

export default generate;
