import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000',
});

export const getData = async (table) => {
  try {
    const response = await apiClient.get(`/${table}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

export const saveData = async (table, data) => {
  try {
    const response = await apiClient.post(`/${table}`, data);
    return response.data;
  } catch (error) {
    console.error('Error saving data:', error);
    throw error;
  }
};

export const updateCustomerBalance = async (customerId, newBalance) => {
  try {
    const response = await apiClient.put(`/customers/${customerId}/balance`, { newBalance });
    return response.data;
  } catch (error) {
    console.error('Error updating customer balance:', error);
    throw error;
  }
};

export const createMessage = async (messageType, wallets, messageArgs, ticketId, xsdContent, root, parent) => {
  try {
    const response = await apiClient.post('/create-message', {
      messageType,
      wallets,
      messageArgs,
      ticketId,
      xsdContent,
      root,
      parent
    });
    return response.data;
  } catch (error) {
    console.error('Error creating message:', error);
    throw error;
  }
};
