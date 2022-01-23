import { Generator } from 'basketry';
import { InterfaceFactory } from './interface-factory';

const generate: Generator = (service) => {
  return new InterfaceFactory().build(service);
};

export default generate;
