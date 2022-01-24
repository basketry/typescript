import { Generator } from 'basketry';
import { ExpressRouterFactory } from './express-factory';

const generate: Generator = (service) => {
  return new ExpressRouterFactory().build(service);
};

export default generate;
