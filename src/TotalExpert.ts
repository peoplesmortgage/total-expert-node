import { Container } from 'typedi';
import { RequestInit, Response } from 'node-fetch';
import {
  AUTH_TOKEN,
  CLIENT_ID,
  CLIENT_SECRET,
  ENVIRONMENT,
  ON_AUTHENTICATE,
  ON_AUTHENTICATE_FAILURE,
} from './utils';
import {
  AdminFullService as WithAdmin,
  FullService,
  PartialService,
  Authentication,
} from './services';
import {
  TotalExpertInit,
  TotalExpertLoanInit,
  TotalExpertLoan,
  TotalExpertLoanAdminInit,
  TotalExpertContact,
  TotalExpertContactAdminInit,
  TotalExpertContactInit,
} from './types';

class TotalExpert {
  authentication: Authentication;

  loans: WithAdmin<TotalExpertLoan, TotalExpertLoanInit, TotalExpertLoanAdminInit>;

  contacts: WithAdmin<TotalExpertContact, TotalExpertContactInit, TotalExpertContactAdminInit>;

  contactGroups: WithAdmin<any, any, any>;

  contactNotes: WithAdmin<any, any, any>;

  campaignActivity: FullService<any, any>;

  campaigns: PartialService<any, any>;

  insights: PartialService<any, any>;

  constructor({
    environment,
    clientId,
    clientSecret,
    accessToken,
    onAuthenticate,
    onAuthenticateFailure,
  }: TotalExpertInit) {
    const hasReqiuredArgs = [clientId, clientSecret].every((value) => Boolean(value));
    if (!hasReqiuredArgs) {
      throw new Error('the clientId and clientSecret values are required in the Total Expert constructor');
    }
    Container.set([
      { id: CLIENT_ID, value: clientId },
      { id: CLIENT_SECRET, value: clientSecret },
      { id: ENVIRONMENT, value: environment || 'https://public.totalexpert.net/' },
      { id: AUTH_TOKEN, value: accessToken || '' },
      { id: ON_AUTHENTICATE, value: onAuthenticate || null },
      { id: ON_AUTHENTICATE_FAILURE, value: onAuthenticateFailure || null },
    ]);

    this.authentication = Container.get(Authentication);
    // full crud with admin create
    this.loans = new WithAdmin<TotalExpertLoan, TotalExpertLoanInit, TotalExpertLoanAdminInit>('/v1/loans');
    this.contacts = new WithAdmin<TotalExpertContact, TotalExpertContactInit, TotalExpertContactAdminInit>('/v1/contacts');
    this.contactGroups = new WithAdmin<any, any, any>('/v1/contact-groups');
    this.contactNotes = new WithAdmin<any, any, any>('/v1/contact-notes');
    // full crud no admin create
    this.campaignActivity = new FullService<any, any>('/v1/campaign-activity');
    // read and create only
    this.campaigns = new PartialService<any, any>('/v1/campaigns');
    this.insights = new PartialService<any, any>('/v1/insights');
  }

  async fetch(url: string, options: RequestInit = {}, skipRetry?: boolean): Promise<Response> {
    const response = await this.authentication.withAuthFetch(url, options, skipRetry);
    return response;
  }

  // short and stout
  async teapot(): Promise<Response> {
    const response = await this.authentication.withAuthFetch('v1/teapot');
    return response;
  }
}

export default TotalExpert;
