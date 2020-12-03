import { Service } from 'typedi';
import ServiceWrapper from './ServiceWrapper';
import { TotalExpertId, TotalExpertContact } from '../types';

@Service()
class Contacts extends ServiceWrapper {
  constructor() {
    super();
  }

  async get(id: TotalExpertId): Promise<TotalExpertContact> {
    const result = await this.getToJSON(`/v1/contacts/${id}`);
    return result;
  }
}

export default Contacts;
