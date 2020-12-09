import 'reflect-metadata';
import FullService from '../../src/services/FullService';
import mockAuthentication, { mockAPIReturnValue } from '../__fixtures__/mockAuthentication';

describe('FullService', () => {
  const mockAuth = mockAuthentication();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('stores its constructor argument as the urlSlug protected property', () => {
    expect(new FullService<any, any>('/the-url-slug-value')).toMatchSnapshot();
  });

  it('exposes an update method that returns the response json of the api call', async () => {
    const returnJson = 'some return data';
    const mockResponseJson = mockAPIReturnValue(returnJson);
    const result = await new FullService('/test').update('test-id', {});

    expect.assertions(2);
    expect(mockResponseJson).toHaveBeenCalled();
    expect(result).toEqual(returnJson);
  });

  it('sets the http verb to PATCH when calling the update method', async () => {
    mockAPIReturnValue();
    await new FullService('/test').update('test-id', {});
    const { method } = mockAuth.withAuthFetch.mock.calls[0][1];
    expect(method).toEqual('PATCH');
  });

  it('sets the http verb to DELETE when hitting the API in the delete method', async () => {
    mockAPIReturnValue();
    await new FullService('/test').delete('test-id');
    const { method } = mockAuth.withAuthFetch.mock.calls[0][1];
    expect(method).toEqual('DELETE');
  });
});
