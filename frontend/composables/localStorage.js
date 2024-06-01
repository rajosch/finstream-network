import { ref } from 'vue';

export const useBankStorage = () => {
  const banks = ref({
    bankUSA: {
      // Wallets created for the purpose of the Chainlink Black Magic hackathon. !!DO NOT USE THEM TO HANDLE ANY REAL FUNDS!!
      address: '0xFB78AF53Fc9BD34f9E078aCb912e8103F08C4819',
      privateKey: '0xb62244005a84f03a995f9109187cac189f3e5d124016d52c731bf119a93cc8da', 
      customers: [
        { id: 1, name: 'Alice', balance: 20000 },
        { id: 2, name: 'Charlie', balance: 5000 }
      ],
      transactions: []
    },
    bankEU: {
      // Wallets created for the purpose of the Chainlink Black Magic hackathon. !!DO NOT USE THEM TO HANDLE ANY REAL FUNDS!!
      address: '0xe725c3F6534563483D3a0Ede818868ceBB1a8c80',
      privateKey: '0x29e23620daa4f30387565e3fea55bd415cfe8f26c1d6886ce25b801b887cc8da', 
      customers: [
        { id: 1, name: 'Bob', balance: 80000 },
        { id: 2, name: 'Diana', balance: 2000 }
      ],
      transactions: []
    },
    gateway: {
      // Wallets created for the purpose of the Chainlink Black Magic hackathon. !!DO NOT USE THEM TO HANDLE ANY REAL FUNDS!!
      address: '0x3638Ee16d0FF3c81A5a104C555ab466b6129FF51',
      privateKey: '0x7d5ce42ce71af1817a82a4d94939a71094fa9866138ac8548e5300eaeab179c9', 
    }
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
