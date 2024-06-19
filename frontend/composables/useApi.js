import axios from 'axios';

// Function to create an apiClient with the specified port
const createApiClient = (port = 3000) => {
  return axios.create({
    baseURL: `http://localhost:${port}`,
  });
};

export const getData = async (table, port = 3000) => {
  try {
    const apiClient = createApiClient(port);
    const response = await apiClient.get(`/${table}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

export const saveData = async (table, data, port = 3000) => {
  try {
    const apiClient = createApiClient(port);
    const response = await apiClient.post(`/${table}`, data);
    return response.data;
  } catch (error) {
    console.error('Error saving data:', error);
    throw error;
  }
};

export const updateCustomerBalance = async (customerId, newBalance, port = 3000) => {
  try {
    const apiClient = createApiClient(port);
    const response = await apiClient.put(`/customers/${customerId}/balance`, { newBalance });
    return response.data;
  } catch (error) {
    console.error('Error updating customer balance:', error);
    throw error;
  }
};

export const createMessage = async (messageType, wallets, messageArgs, ticketId, parent, port = 3000) => {
  try {
    const apiClient = createApiClient(port);
    const response = await apiClient.post('/create-message', {
      messageType,
      wallets,
      messageArgs,
      ticketId,
      parent
    });
    return response.data;
  } catch (error) {
    console.error('Error creating message:', error);
    throw error;
  }
};
