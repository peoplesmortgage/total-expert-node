/* eslint-disable camelcase */
import Authentication from './services/Authentication';

export type TotalExpertAuth = InstanceType<typeof Authentication>;

// eslint-disable-next-line no-unused-vars
export type AuthenticationHook = (totalExpertAuthentication: Authentication) => Promise<void>;

export interface TotalExpertInit {
  clientId: string;
  clientSecret: string;
  environment?: string;
  accessToken?: string | null;
  onAuthenticate?: AuthenticationHook;
  onAuthenticateFailure?: AuthenticationHook;
}

export type TotalExpertId = string | number;

export type TotalExpertBoolean = 1 | 0;

export interface TotalExpertUser {
  username?: string;
  id?: string | number;
  external_id?: string | number;
  email?: string;
  [key: string]: any;
}

export interface TotalExpertBorrower {
  first_name: string;
  last_name: string;
  phone_cell?: string;
  phone_home?: string;
  phone_office?: string;
  email?: string;
  [key: string]: any;
}

export interface TotalExpertContactInit extends TotalExpertBorrower {
  source: string;
}

export interface TotalExpertContactAdminInit extends TotalExpertContactInit {
  owner: TotalExpertUser;
}

export interface TotalExpertContact extends TotalExpertContactAdminInit {
  readonly id: number;
  title?: string;
  address?: string;
  address_2?: string;
  birthday?: string;
  city?: string;
  close_date?: string;
  creation_date?: string;
  [key: string]: any;
}

export interface CustomFieldContract {
  value: any;
  field_name: string;
  description?: string;
}

export interface TotalExpertLoanInit {
  external_id: string | number;
  custom?: CustomFieldContract[];
  borrower: TotalExpertBorrower;
  [key: string]: any;
}

export interface TotalExpertLoanAdminInit extends TotalExpertLoanInit {
  owner: TotalExpertUser;
}

export interface TotalExpertLoan {
  readonly id: number;
}

export interface GetManyResponse<T> {
  items: T[];
  links: {
    first: number | null;
    last: number | null;
    next: number | null;
    prev: number | null;
  }
}

export interface UpdateResponse {
  readonly id: number;
  existing: string;
  hash?: string;
  [key: string]: any;
}

export interface CreatedResponse {
  readonly id: number;
  created?: string;
  duplicate?: string;
  hash?: string;
}
