import { Factory } from '@basketry/jest-utils';
import generator from '../..';

const ir = new Factory();

describe('4.1.2 Interface', () => {
  it('does not crash when provided an empty service', async () => {
    // ARRANGE
    const service = ir.service({
      interfaces: [],
      types: [],
      enums: [],
      unions: [],
    });

    // ACT
    const result = await generator(service);

    console.log(result[0].contents);
  });
});
