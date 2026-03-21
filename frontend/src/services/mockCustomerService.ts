export interface CustomerProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface Address {
  id: string;
  customerId: string;
  label: string;
  street: string;
  city: string;
  zipCode: string;
}

export interface Preferences {
  customerId: string;
  detergentType: string;
  fabricSoftener: boolean;
  notes: string;
}

class MockCustomerService {
  private getStorage<T>(key: string, defaultValue: T): T {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  }

  private setStorage<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // Profile Management
  async createCustomer(profileData: Omit<CustomerProfile, 'id'>): Promise<CustomerProfile> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const customers = this.getStorage<CustomerProfile[]>('mock_customers', []);
    const newCustomer = { ...profileData, id: Math.random().toString(36).substring(7) };
    this.setStorage('mock_customers', [...customers, newCustomer]);
    return newCustomer;
  }

  async getCustomerById(customerId: string): Promise<CustomerProfile | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const customers = this.getStorage<CustomerProfile[]>('mock_customers', []);
    return customers.find(c => c.id === customerId) || null;
  }

  async updateCustomer(customerId: string, data: Partial<CustomerProfile>): Promise<CustomerProfile> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const customers = this.getStorage<CustomerProfile[]>('mock_customers', []);
    const index = customers.findIndex(c => c.id === customerId);
    if (index === -1) throw new Error("Customer not found");
    const updated = { ...customers[index], ...data };
    customers[index] = updated;
    this.setStorage('mock_customers', customers);
    return updated;
  }

  async deleteCustomer(customerId: string): Promise<void> {
    const customers = this.getStorage<CustomerProfile[]>('mock_customers', []);
    this.setStorage('mock_customers', customers.filter(c => c.id !== customerId));
  }

  // Address Management
  async addAddress(customerId: string, address: Omit<Address, 'id' | 'customerId'>): Promise<Address> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const addresses = this.getStorage<Address[]>('mock_addresses', []);
    const newAddress = { ...address, id: Math.random().toString(36).substring(7), customerId };
    this.setStorage('mock_addresses', [...addresses, newAddress]);
    return newAddress;
  }

  async getAddresses(customerId: string): Promise<Address[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const addresses = this.getStorage<Address[]>('mock_addresses', []);
    return addresses.filter(a => a.customerId === customerId);
  }

  async updateAddress(addressId: string, data: Partial<Address>): Promise<Address> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const addresses = this.getStorage<Address[]>('mock_addresses', []);
    const index = addresses.findIndex(a => a.id === addressId);
    if (index === -1) throw new Error("Address not found");
    const updated = { ...addresses[index], ...data };
    addresses[index] = updated;
    this.setStorage('mock_addresses', addresses);
    return updated;
  }

  async deleteAddress(addressId: string): Promise<void> {
    const addresses = this.getStorage<Address[]>('mock_addresses', []);
    this.setStorage('mock_addresses', addresses.filter(a => a.id !== addressId));
  }

  // Preferences
  async setPreferences(customerId: string, prefs: Omit<Preferences, 'customerId'>): Promise<Preferences> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const preferencesList = this.getStorage<Preferences[]>('mock_preferences', []);
    const index = preferencesList.findIndex(p => p.customerId === customerId);
    const newPref = { ...prefs, customerId };
    
    if (index !== -1) {
      preferencesList[index] = newPref;
    } else {
      preferencesList.push(newPref);
    }
    
    this.setStorage('mock_preferences', preferencesList);
    return newPref;
  }

  async getPreferences(customerId: string): Promise<Preferences | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const preferencesList = this.getStorage<Preferences[]>('mock_preferences', []);
    return preferencesList.find(p => p.customerId === customerId) || null;
  }
}

export const mockCustomerService = new MockCustomerService();
