import { ref } from 'vue';

export const useBankStorage = () => {
  const banks = ref({
    bankUSA: {
      customers: [
        { id: 1, name: 'Alice', balance: 20000 },
        { id: 2, name: 'Charlie', balance: 5000 }
      ],
      transactions: []
    },
    bankEU: {
      customers: [
        { id: 1, name: 'Bob', balance: 80000 },
        { id: 2, name: 'Diana', balance: 2000 }
      ],
      transactions: []
    },
  });

  const setItem = (key, value) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  };

  const getItem = (key) => {
    if (typeof window !== 'undefined') {
      const storedValue = localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : null;
    }
    return null;
  };

  const removeItem = (key) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  };

  const loadBanks = () => {
    const storedBanks = getItem('banks');
    if (storedBanks) {
      banks.value = storedBanks;
    } else {
      saveBanks(); 
    }
  };

  const saveBanks = () => {
    setItem('banks', banks.value);
  };

  const addCustomer = (bankName, customer) => {
    banks.value[bankName].customers.push(customer);
    saveBanks();
  };

  const addTransaction = (bankName, transaction) => {
    banks.value[bankName].transactions.push(transaction);
    saveBanks();
  };

  const getBank = (bankName) => {
    return banks.value[bankName];
  };

  const clearBanks = () => {
    banks.value = {
      bankUSA: {
        customers: [],
        transactions: [],
      },
      bankEU: {
        customers: [],
        transactions: [],
      },
    };
    removeItem('banks');
  };

  const updateTransactionStatus = (bankName, transactionId, newStatus) => {
    const bank = banks.value[bankName];
    const transaction = bank.transactions.find(t => t.id === transactionId);
    if (transaction) {
      transaction.status = newStatus;
      saveBanks();
    }
  };

  const addTransactionMessage = (bankName, transactionId, message) => {
    const bank = banks.value[bankName];
    const transaction = bank.transactions.find(t => t.id === transactionId);
    if (transaction) {
      if (!transaction.messages) {
        transaction.messages = [];
      }
      transaction.messages.push(message);
      saveBanks();
    }
  };

  loadBanks();

  return {
    banks,
    addCustomer,
    addTransaction,
    getBank,
    clearBanks,
    updateTransactionStatus,
    addTransactionMessage,
  };
};
