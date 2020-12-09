import { Container } from 'typedi';
import Authentication from '../../src/services/Authentication';

const mockAuthentication = {
  authenticate: jest.fn(),
  setAccessToken: jest.fn(),
  withAuthFetch: jest.fn(),
};

const mockAuthenticationService = () => {
  Container.set(Authentication, mockAuthentication);
  return mockAuthentication;
};

export const mockAPIReturnValue = (value?: any) => {
  const mockResponseJson = jest.fn();
  mockAuthentication.withAuthFetch.mockResolvedValueOnce({
    json: mockResponseJson.mockResolvedValueOnce(value),
  });
  return mockResponseJson;
};

export const expectAPICallArgsToMatch = () => {
  const [url, fetchOpts, skipRetry] = mockAuthentication.withAuthFetch.mock.calls[0];
  const body = fetchOpts.body ? JSON.parse(fetchOpts.body) : {};
  const formattedOpts = { ...fetchOpts, body };
  expect({ url, options: formattedOpts, skipRetry }).toMatchSnapshot();
};

export default mockAuthenticationService;
