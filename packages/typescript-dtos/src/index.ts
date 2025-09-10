import { Generator } from 'basketry';
import { ExpressDtoFactory } from './dto-factory';
import { ExpressMapperFactory } from './mapper-factory';
import { ExpressReadmeFactory } from './readme-factory';

export * from './types';

const generate: Generator = async (service, options) => {
  return [
    ...(await new ExpressDtoFactory(service, options).build()),
    ...(await new ExpressMapperFactory(service, options).build()),
    ...(await new ExpressReadmeFactory(service, options).build()),
  ];
};

export default generate;
