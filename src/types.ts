/* eslint-disable camelcase */
import Authentication from './services/Authentication';

export interface TotalExpertInit {
  clientId: string;
  clientSecret: string;
  environment?: string;
  accessToken?: string | null;
  // eslint-disable-next-line no-unused-vars
  onAuthenticate?: (totalExpertAuthentication: Authentication) => Promise<void>;
}

export type TotalExpertId = string | number;

export type TotalExpertBoolean = 1 | 0;

export interface TotalExpertUser {
  username?: string;
  id?: string | number;
  external_id?: string | number;
  email?: string;
}

export interface TotalExpertContractInit {
  source: string;
  first_name: string;
  last_name: string;
  phone_cell?: string;
  phone_home?: string;
  phone_office?: string;
  email?: string;
}

export interface TotalExpertContract extends TotalExpertContractInit{
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
  borrower: TotalExpertContractInit;
  [key: string]: any;
}

export interface TotalExpertLoanAdminInit extends TotalExpertLoanInit {
  owner: TotalExpertUser;
}
