import 'reflect-metadata';
import PartialService from '../../src/services/PartialService';
import mockAuthentication, { mockAPIReturnValue } from '../__fixtures__/mockAuthentication';

describe('PartialService', () => {
  const mockAuth = mockAuthentication();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('stores its constructor argument as the urlSlug protected property', () => {
    expect(new PartialService<any, any>('/the-url-slug-value')).toMatchSnapshot();
  });

  ['create', 'get', 'getMany'].forEach((method) => {
    it(`exposes the ${method} method`, () => {
      const wrapper = new PartialService<any, any>('/some-value') as any;
      expect(typeof wrapper[method] as any).toEqual('function');
    });
  });

  ['get', 'getMany'].forEach((method) => {
    it(`exposes a ${method} method that returns the json response from an API request`, async () => {
      const mockResponseJSONValue = 'the mock response value';
      mockAPIReturnValue(mockResponseJSONValue);
      const wrapper = new PartialService('/') as any;
      const result = await wrapper[method]('test-id') as any;

      expect.assertions(2);
      expect(mockAuth.withAuthFetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponseJSONValue);
    });
  });

  it('will create a record with the arguments provided', async () => {
    mockAPIReturnValue({});
    await new PartialService('/the-resource-slug').create({ mock: 'test data' });

    const fetchArgs = mockAuth.withAuthFetch.mock.calls[0];
    expect(fetchArgs).toMatchSnapshot();
  });

  it('will update the page return parameters based off the arguments provided to getMany', async () => {
    mockAPIReturnValue({});
    await new PartialService('/').getMany(10, 100);
    const requestedUrl = mockAuth.withAuthFetch.mock.calls[0][0];
    const queryString = requestedUrl.split('?')[1];
    expect(queryString).toEqual('page[number]=10&page[size]=100');
  });

  it('will return the first 10 records of page 0 if no arguments are provided to getMany', async () => {
    mockAPIReturnValue({});
    await new PartialService('/').getMany();
    const requestedUrl = mockAuth.withAuthFetch.mock.calls[0][0];
    const queryString = requestedUrl.split('?')[1];
    expect(queryString).toEqual('page[number]=0&page[size]=10');
  });
});
