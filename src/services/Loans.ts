import { Service, Inject } from 'typedi';
import Authentication from './Authentication';
import { TotalExpertId, TotalExpertLoanAdminInit } from '../types';

@Service()
class Loans {
  @Inject()
  auth!: Authentication;

  constructor() {}

  async fetchLoans(pageNumber: number = 1, pageSize: number = 10) {
    const url = `/v1/loans?page[number]=${pageNumber}&page[size]=${pageSize}`;
    return this.auth.getToJSON(url);
  }

  async createLoanAdmin(loanData: TotalExpertLoanAdminInit) {
    const options = { method: 'POST', body: JSON.stringify(loanData) };
    const response = await this.auth.withAuthFetch('/v1/loans', options);
    const data = await response.json();
    return data;
  }

  async deleteLoan(id: TotalExpertId): Promise<void> {
    await this.auth.withAuthFetch(`/v1/loans/${id}`, { method: 'DELETE' });
  }
}

export default Loans;
