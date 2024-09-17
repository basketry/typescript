import { Generator } from 'basketry';
import { ExpressDtoFactory } from './dto-factory';
import { ExpressHandlerFactory } from './handler-factory';
import { ExpressMapperFactory } from './mapper-factory';
import { ExpressRouterFactoryFactory } from './router-factory-factory';
import { ExpressTypesFactory } from './types-factory';
import { ExpressIndexFactory } from './index-factory';
import { ExpressReadmeFactory } from './readme-factory';
import { ExpressErrorsFactory } from './errors-factory';

export * from './types';

const generate: Generator = (service, options) => {
  return [
    ...new ExpressIndexFactory(service, options).build(),
    ...new ExpressTypesFactory(service, options).build(),
    ...new ExpressRouterFactoryFactory(service, options).build(),
    ...new ExpressDtoFactory(service, options).build(),
    ...new ExpressMapperFactory(service, options).build(),
    ...new ExpressHandlerFactory(service, options).build(),
    ...new ExpressReadmeFactory(service, options).build(),
    ...new ExpressErrorsFactory(service, options).build(),
  ];
};

export default generate;
