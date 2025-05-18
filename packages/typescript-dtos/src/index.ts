import { Generator } from 'basketry';
import { ExpressDtoFactory } from './dto-factory';
import { ExpressMapperFactory } from './mapper-factory';
import { ExpressReadmeFactory } from './readme-factory';

export * from './types';

const generate: Generator = (service, options) => {
  return [
    ...new ExpressDtoFactory(service, options).build(),
    ...new ExpressMapperFactory(service, options).build(),
    ...new ExpressReadmeFactory(service, options).build(),
  ];
};

export default generate;
