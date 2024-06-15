<template>
  <div class="flex flex-col items-center justify-center py-10">
    <!-- If logged out -->
    <div
      v-if="!loggedIn"
      class="w-full max-w-md p-8 bg-white rounded shadow-lg"
    >
      <select
        id="user-select"
        v-model="selectedCustomer"
        class="w-full p-2 border rounded mb-4 text-gray-500"
      >
        <option
          disabled
          value=""
        >
          Select a customer
        </option>
        <option
          v-for="name in availableCustomers"
          :key="name"
          :value="name"
        >
          {{ name }}
        </option>
      </select>
      <button
        class="w-full bg-blue-500 text-white p-2 rounded"
        @click="logIn"
      >
        Log In
      </button>
    </div>
        
    <!-- If logged in -->
    <div
      v-else
      class="w-full max-w-4xl p-8 bg-white rounded shadow-lg relative"
    >
      <div class="text-gray-700 text-xl font-bold mb-5">
        {{ customer.name }}
      </div>
      <div class="absolute top-4 right-4 text-gray-700">
        <button
          class="ml-4 text-red-500"
          @click="logOut"
        >
          Log Out
        </button>
      </div>
      <div class="grid grid-cols-5 gap-x-8">
        <div class="col-span-3">
          <h3 class="text-lg font-semibold mb-2 text-gray-700">
            Account Balance
          </h3>
          <p class="text-lg text-gray-500">
            {{ currencySymbol }}{{ customer.balance }}
          </p>
          <h3 class="text-lg font-semibold mt-6 mb-2 text-gray-700">
            Transfer Money
          </h3>
          <input
            v-model="transferAmount"
            type="number"
            :placeholder="`Amount in ${bank.currency}`"
            class="w-full p-2 border rounded mb-2 text-gray-500"
            min="0"
          >
          <label
            for="recipient-select"
            class="block text-lg mb-2 text-gray-700"
          >Select Recipient:</label>
          <select
            id="recipient-select"
            v-model="transferRecipient"
            class="w-full p-2 border rounded mb-4 text-gray-500"
          >
            <option
              disabled
              value=""
            >
              Choose a recipient
            </option>
            <option
              v-for="name in otherCustomers"
              :key="name"
              :value="name"
            >
              {{ name }} ({{ otherCurrenncy }})
            </option>
          </select>
          <button
            class="w-full bg-green-500 text-white p-2 rounded"
            @click="startTransaction"
          >
            Transfer
          </button>
        </div>
        <div class="col-span-2 flex flex-col gap-y-1 h-84 overflow-auto">
          <h3 class="text-lg font-semibold mb-2 text-gray-700">
            Transfers
          </h3>
          TODO PAST TRANSFERS
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ethers } from 'ethers';

export default {
  props: {
    selectedBank: {
      type: String,
      required: true
    }
  },
  async setup() {
    const banks = await getData('entities');
    const customers = await getData('customers')
    return { banks, customers };
  },
  data() {
    return {
      loggedIn: false,
      selectedCustomer: '',
      transferAmount: '',
      transferRecipient: ''
    };
  },
  computed: {
    bank() {
      return this.banks.find(obj => obj.name === this.selectedBank);
    },
    customer() {
      return this.customers.find(obj => obj.name === this.selectedCustomer)
    },
    availableCustomers() {
      return this.selectedBank.localeCompare('Bank USA') === 0 ? ['Alice', 'Charlie'] : ['Bob', 'Diana']
    },
    otherCustomers() {
      return this.selectedBank.localeCompare('Bank EU') === 0 ? ['Alice', 'Charlie'] : ['Bob', 'Diana']
    },
    otherCurrenncy() {
      return this.bank.currency.toString().localeCompare('$') === 0 ? '€' : '$';
    }
  },
  methods: {
    logIn() {
      this.loggedIn = true;
    },
    logOut() {
      this.selectedCustomer = '';
      this.transferAmount = '';
      this.transferRecipient = '';
      this.loggedIn = false;
    },
    async startTransaction() {
      if (this.transferAmount > 0 && this.transferAmount <= this.customer.balance && this.transferRecipient.length !== 0) {
        const euWallet = new ethers.Wallet(this.banks.bankEU.privateKey);
        const usaWallet = new ethers.Wallet(this.banks.bankUSA.privateKey);
        const gatewayWallet = new ethers.Wallet(this.banks.gateway.privateKey);
        const wallets = [euWallet, usaWallet, gatewayWallet];

        // Initiate transaction
        this.customer.balance -= this.transferAmount;

        // 0. Mint transaction ticket
        const ticketId = 'ticketID'; // TODO contract call await controller.mintTicket(...)

        let messageType = 'pain.001.001.12'
        let messageArgs = {};

        let message = createMessage(messageType, messageArgs);

        // 4. Create transaction
        const transaction = {
          id: ticketId,
          amount: this.transferAmount,
          recipient: this.transferRecipient,
          sender: this.customer,
          status: 'initiated',
          messages: [message]
        };

        // 5. Add transaction to 'data base'
        this.addTransaction(this.selectedBankName, transaction);

        await this.sleep(500);


        messageArgs = {};
        messageType = 'pain.001.001.12'

        message = createMessage(messageType, messageArgs);

        // TODO update merkle root on chain
        this.addTransactionMessage(this.selectedBankName, transaction.id, message);
        this.updateTransactionStatus(this.selectedBankName, transaction.id, 'forwarded');

        await this.sleep(500);
        const exchangeRate = 0.9; // TODO update query exchange rate from chain

        
        messageArgs = {};
        messageType = 'fxtr.014.001.05'

        message = createMessage(messageType, messageArgs);

        // TODO update merkle root on chain
        this.addTransactionMessage(this.selectedBankName, transaction.id, message);
        this.updateTransactionStatus(this.selectedBankName, transaction.id, 'set exchange rate');

        await this.sleep(500);

        // Bank accepts exchange rate

        // TODO update merkle root on chain
        this.updateTransactionStatus(this.selectedBankName, transaction.id, 'accept exchange rate');

        await this.sleep(500);

        // Native currency exchanged for target currency
        // TODO call controller to start transfer
        messageArgs = {};
        messageType = 'pain.001.001.12'

        message = createMessage(messageType, messageArgs);

        // TODO update merkle root on chain
        this.addTransactionMessage(this.selectedBankName, transaction.id, message);
        this.updateTransactionStatus(this.selectedBankName, transaction.id, 'transfer');

        // TODO add transaction hash to transaction object 
        await this.sleep(500);

        // Money sent
        messageArgs = {};
        messageType = 'pain.001.001.12'

        message = createMessage(messageType, messageArgs);

        // TODO update merkle root on chain
        this.addTransactionMessage(this.selectedBankName, transaction.id, message);
        this.updateTransactionStatus(this.selectedBankName, transaction.id, 'sent');

        await this.sleep(500);
        // Transaction completed
        // TODO add pacs message
        messageArgs = {};
        messageType = 'pacs.002.001.14'

        message = createMessage(messageType, messageArgs);

        // TODO update merkle root on chain
        this.addTransactionMessage(this.selectedBankName, transaction.id, message);
        this.updateTransactionStatus(this.selectedBankName, transaction.id, 'completed');

        this.transferRecipient.balance += this.transferAmount * exchangeRate; // adjust calculation depending on switch direction
      } else {
        alert("Please enter a positive amount and select a recipient.");
      }

      this.transferAmount = '';
      this.transferRecipient = '';
    },
    async sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },
    async loadFile(filePath) {
      const response = await fetch(filePath);
      return response.text();
    }
  }
};
</script>
