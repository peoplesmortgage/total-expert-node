import 'reflect-metadata';
import AdminFullService from '../../src/services/AdminFullService';
import mockAuthentication, { mockAPIReturnValue } from '../__fixtures__/mockAuthentication';

describe('AdminFullService', () => {
  const mockAuth = mockAuthentication();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('exposes a createAsAdmin function that makes a POST call to the provided url', async () => {
    mockAPIReturnValue({});
    const testUrl = '/the-resource-url';
    const testData = {
      first_name: 'Bojack',
      last_name: 'Horseman',
      occupation: 'Actor',
    };
    await new AdminFullService(testUrl).createAsAdmin(testData);
    const [fetchUrl, fetchOptions] = mockAuth.withAuthFetch.mock.calls[0];
    expect(fetchUrl).toEqual(testUrl);
    expect(fetchOptions).toEqual({
      method: 'POST',
      body: JSON.stringify(testData),
    });
  });
});
