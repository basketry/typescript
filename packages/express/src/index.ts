import { Generator } from 'basketry';
import { ExpressHandlerFactory } from './handler-factory';
import { ExpressRouterFactoryFactory } from './router-factory-factory';
import { ExpressTypesFactory } from './types-factory';
import { ExpressIndexFactory } from './index-factory';
import { ExpressReadmeFactory } from './readme-factory';
import { ExpressErrorsFactory } from './errors-factory';

export * from './types';

const generate: Generator = async (service, options) => {
  return [
    ...(await new ExpressIndexFactory(service, options).build()),
    ...(await new ExpressTypesFactory(service, options).build()),
    ...(await new ExpressRouterFactoryFactory(service, options).build()),
    ...(await new ExpressHandlerFactory(service, options).build()),
    ...(await new ExpressReadmeFactory(service, options).build()),
    ...(await new ExpressErrorsFactory(service, options).build()),
  ];
};

export default generate;
