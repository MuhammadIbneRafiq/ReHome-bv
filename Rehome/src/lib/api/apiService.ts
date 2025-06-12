import axios, { AxiosResponse, AxiosError } from 'axios';
import { API_ENDPOINTS, getAuthHeaders } from './config';

// API Service class for handling HTTP requests
class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  // Generic request method
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    data?: any,
    requiresAuth = false
  ): Promise<T> {
    try {
      const headers = requiresAuth ? getAuthHeaders(this.getToken() || undefined) : { 'Content-Type': 'application/json' };
      
      const config = {
        method,
        url,
        headers,
        ...(data && { data }),
      };

      const response: AxiosResponse<T> = await axios(config);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  // Error handler
  private handleError(error: AxiosError): Error {
    if (error.response) {
      // Server responded with error status
      const message = (error.response.data as any)?.error || error.response.statusText;
      return new Error(`API Error: ${message}`);
    } else if (error.request) {
      // Request was made but no response received
      return new Error('Network Error: No response from server');
    } else {
      // Something else happened
      return new Error(`Request Error: ${error.message}`);
    }
  }

  // Authentication methods
  async login(email: string, password: string) {
    console.log('🔐 Attempting login with:', { email, password: '***' });
    console.log('🌐 Login URL:', API_ENDPOINTS.AUTH.LOGIN);
    return this.request<{ accessToken: string }>('POST', API_ENDPOINTS.AUTH.LOGIN, {
      email,
      password,
    });
  }

  async signup(email: string, password: string) {
    return this.request<{ message: string; accessToken?: string }>('POST', API_ENDPOINTS.AUTH.SIGNUP, {
      email,
      password,
    });
  }

  async logout() {
    return this.request<{ message: string }>('POST', API_ENDPOINTS.AUTH.LOGOUT, {}, true);
  }

  // Furniture methods
  async getFurniture() {
    return this.request<any[]>('GET', API_ENDPOINTS.FURNITURE.LIST);
  }

  async createFurniture(furnitureData: any) {
    return this.request<any>('POST', API_ENDPOINTS.FURNITURE.CREATE, furnitureData, true);
  }

  async deleteFurniture(id: string) {
    return this.request<any>('DELETE', API_ENDPOINTS.FURNITURE.DELETE(id), {}, true);
  }

  async markFurnitureSold(id: string) {
    return this.request<any>('POST', API_ENDPOINTS.FURNITURE.MARK_SOLD(id), {}, true);
  }

  async getFurnitureById(id: string) {
    return this.request<any>('GET', API_ENDPOINTS.FURNITURE.GET_BY_ID(id), {}, true);
  }

  // Moving services
  async createItemMovingRequest(requestData: any) {
    return this.request<any>('POST', API_ENDPOINTS.MOVING.ITEM_REQUEST, requestData);
  }

  async createHouseMovingRequest(requestData: any) {
    return this.request<any>('POST', API_ENDPOINTS.MOVING.HOUSE_REQUEST, requestData);
  }

  async createSpecialRequest(requestData: any) {
    return this.request<any>('POST', API_ENDPOINTS.MOVING.SPECIAL_REQUEST, requestData);
  }

  // Email service
  async sendEmail(emailData: { email: string; firstName: string; lastName: string }) {
    return this.request<{ success: boolean }>('POST', API_ENDPOINTS.EMAIL.SEND, emailData);
  }

  // Legal document methods
  async acceptTerms(acceptanceData: {
    userId: string;
    acceptedAt: string;
    termsVersion: string;
    privacyVersion: string;
  }) {
    return this.request<{ success: boolean }>('POST', API_ENDPOINTS.LEGAL.ACCEPT_TERMS, acceptanceData, true);
  }

  // Pricing methods
  async calculatePricing(pricingData: any) {
    return this.request<any>('POST', API_ENDPOINTS.PRICING.CALCULATE, pricingData);
  }

  // Upload methods
  async uploadPhotos(formData: FormData) {
    try {
      const token = this.getToken();
      const headers: any = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.post(API_ENDPOINTS.UPLOAD.PHOTOS, formData, {
        headers,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  // Messages methods
  async getMessagesByItem(itemId: string) {
    return this.request<any[]>('GET', API_ENDPOINTS.MESSAGES.BY_ITEM(itemId));
  }

  async getMessagesByUser(userId: string) {
    return this.request<any[]>('GET', API_ENDPOINTS.MESSAGES.BY_USER(userId));
  }

  async createMessage(messageData: any) {
    return this.request<any>('POST', API_ENDPOINTS.MESSAGES.CREATE, messageData);
  }

  async markMessagesAsRead(messageIds: string[]) {
    return this.request<any>('PUT', API_ENDPOINTS.MESSAGES.MARK_READ, { messageIds });
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();
export default apiService; 