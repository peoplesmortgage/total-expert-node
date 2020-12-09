/* eslint-disable no-new */
import 'reflect-metadata';
import { Container } from 'typedi';
import TotalExpert from '../src/TotalExpert';
import {
  AUTH_TOKEN,
  CLIENT_ID,
  CLIENT_SECRET,
  ENVIRONMENT,
  ON_AUTHENTICATE,
} from '../src/utils';
import mockAuthentication from './__fixtures__/mockAuthentication';

describe('TotalExpert', () => {
  const mockAuth = mockAuthentication();

  const clearInitContainer = () => {
    Container.remove(AUTH_TOKEN);
    Container.remove(CLIENT_ID);
    Container.remove(CLIENT_SECRET);
    Container.remove(ENVIRONMENT);
    Container.remove(ON_AUTHENTICATE);
  };

  beforeEach(() => {
    jest.resetAllMocks();
    clearInitContainer();
  });

  it('throws an error if it is not provided a client id or client secret', () => {
    expect(() => {
      // @ts-ignore
      new TotalExpert({});
    }).toThrowError('the clientId and clientSecret values are required in the Total Expert constructor');
  });

  const init: any = {
    clientId: 'clientId',
    clientSecret: 'clientSecret',
    environment: 'environment',
    onAuthenticate: jest.fn(),
    accessToken: 'accessToken',
  };

  const basicInit = { clientId: 'id', clientSecret: 'secret' };

  [
    ['clientId', CLIENT_ID],
    ['clientSecret', CLIENT_SECRET],
    ['environment', ENVIRONMENT],
    ['onAuthenticate', ON_AUTHENTICATE],
    ['accessToken', AUTH_TOKEN],
  ].forEach(([value, containerKey]) => {
    it(`stores the ${value} provided in the constructor in the container`, () => {
      new TotalExpert(init);
      const initValue = init[value as any] as any;
      expect(Container.get(containerKey)).toEqual(initValue);
    });
  });

  it('uses the production environment as a fallback if no environment is provided', () => {
    new TotalExpert(basicInit);
    expect(Container.get(ENVIRONMENT)).toEqual('https://public.totalexpert.net/');
  });

  it('uses an empty string as a fallback if no accessToken is provided', () => {
    new TotalExpert(basicInit);
    expect(Container.get(AUTH_TOKEN)).toEqual('');
  });

  it('uses null as a fallback if no onAuthenticate is provided', () => {
    new TotalExpert(basicInit);
    expect(Container.get(ON_AUTHENTICATE)).toEqual(null);
  });

  [
    'authentication',
    'loans',
    'contacts',
    'contactGroups',
    'contactNotes',
    'campaignActivity',
    'campaigns',
    'insights',
  ].forEach((service) => {
    it(`it exposes the ${service} service`, () => {
      const te: any = new TotalExpert(basicInit);
      expect(te[service]).toBeTruthy();
    });
  });

  it('exposes a fetch method that makes an authenticated api call with the provided args', async () => {
    const testUrl = '/test';
    const testOpts = { body: 'options!' };
    const te = new TotalExpert(basicInit);
    await te.fetch(testUrl, testOpts, false);
    expect(mockAuth.withAuthFetch.mock.calls[0]).toEqual([
      testUrl,
      testOpts,
      false,
    ]);
  });

  it('will default to an empty object if no request options are provided', async () => {
    await new TotalExpert(init).fetch('/some-url');
    const defaultFetchOpts = mockAuth.withAuthFetch.mock.calls[0][1];
    expect(defaultFetchOpts).toEqual({});
  });

  it('exposes a teapot method which calls the teapot url', async () => {
    await new TotalExpert(init).teapot();
    expect(mockAuth.withAuthFetch.mock.calls[0][0]).toEqual('v1/teapot');
  });
});
