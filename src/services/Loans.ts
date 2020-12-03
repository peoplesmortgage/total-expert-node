import { Service } from 'typedi';
import ServiceWrapper from './ServiceWrapper';
import {
  TotalExpertId,
  TotalExpertLoanAdminInit,
  TotalExpertLoanInit,
  TotalExpertLoan,
} from '../types';

@Service()
class Loans extends ServiceWrapper {
  constructor() {
    super('/v1/loans');
  }

  private async createLoan(loanData: TotalExpertLoanAdminInit | TotalExpertLoanInit): Promise<any> {
    const options = { method: 'POST', body: JSON.stringify(loanData) };
    const response = await this.auth.withAuthFetch('/v1/loans', options);
    const data = await response.json();
    return data;
  }

  async get(id: TotalExpertId): Promise<TotalExpertLoan> {
    return this.getToJSON(`v1/loans/${id}`);
  }

  async getMany(pageNumber: number = 1, pageSize: number = 10) {
    const url = `/v1/loans?page[number]=${pageNumber}&page[size]=${pageSize}`;
    return this.getToJSON(url);
  }

  async createAsAdmin(loanData: TotalExpertLoanAdminInit) {
    const result = await this.createLoan(loanData);
    return result;
  }

  async createAsUser(loanData: TotalExpertLoanInit) {
    const result = await this.createLoan(loanData);
    return result;
  }

  async update(id: TotalExpertId, loanData: { [key: string]: any }) {
    const response = await this.auth.withAuthFetch(
      `v1/loans/${id}`,
      { method: 'PATCH', body: JSON.stringify(loanData) },
    );
    const data = await response.json();
    return data;
  }

  async delete(id: TotalExpertId): Promise<void> {
    await this.auth.withAuthFetch(`/v1/loans/${id}`, { method: 'DELETE' });
  }
}

export default Loans;
