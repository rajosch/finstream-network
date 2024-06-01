<template>
  <div class="flex flex-col items-center justify-center py-10">
    <!-- If logged out -->
    <div
      v-if="!loggedIn"
      class="w-full max-w-md p-8 bg-white rounded shadow-lg"
    >
      <h2 class="text-2xl font-bold mb-4 text-center text-gray-700">
        {{ selectedBank }}
      </h2>
      <label
        for="user-select"
        class="block text-lg mb-2 text-gray-500"
      >Select User:</label>
      <select
        id="user-select"
        v-model="selectedUser"
        class="w-full p-2 border rounded mb-4 text-gray-500"
      >
        <option
          disabled
          value=""
        >
          Choose a user
        </option>
        <option
          v-for="user in banks[selectedBankName].customers"
          :key="user.id"
          :value="user"
        >
          {{ user.name }}
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
      <div class="absolute top-4 left-4 text-gray-700 text-lg font-semibold">
        {{ selectedUser.name }}
      </div>
      <div class="absolute top-4 right-4 text-gray-700">
        <button
          class="ml-4 text-red-500"
          @click="logOut"
        >
          Log Out
        </button>
      </div>
      <h2 class="text-2xl font-bold mb-4 text-center text-gray-700">
        {{ selectedBank }}
      </h2>
      <div class="grid grid-cols-5 gap-x-8">
        <div class="col-span-3">
          <h3 class="text-xl font-semibold mb-2 text-gray-700">
            Account Balance
          </h3>
          <p class="text-lg text-gray-500">
            {{ currencySymbol }}{{ selectedUser.balance }}
          </p>
          <h3 class="text-xl font-semibold mt-6 mb-2 text-gray-700">
            Transfer Money
          </h3>
          <input
            v-model="transferAmount"
            type="number"
            :placeholder="`Amount in ${currencySymbol}`"
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
              v-for="user in banks[nonSelectedBankName].customers"
              :key="user.id"
              :value="user"
            >
              {{ user.name }} ({{ notCurrencySymbol }})
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
          <h3 class="text-xl font-semibold mb-2 text-gray-700">
            Transfers
          </h3>
          <div 
            v-for="transaction in banks[selectedBankName].transactions"
            :key="transaction.id"
            :class="[
              transaction.status.localeCompare('completed') === 0 ? 'text-gray-500' : 'text-green-500', 
              transaction.status.localeCompare('failed') === 0 ? 'text-red-500' : ''
            ]"
          >
            <div 
              v-if="transaction.sender.name.localeCompare(selectedUser.name) === 0"
              class=""
            >
              <div class="flex items-center">
                ID:
                {{ transaction.id }}
              </div>
              <div class="ml-9">
                <div>
                  Recipient: {{ transaction.recipient.name }}
                </div>
                <div>
                  Amount: {{ transaction.amount }}
                </div>
                <div>
                  Status: {{ transaction.status }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useBankStorage } from '@/composables/localStorage';
import { ethers } from 'ethers';

export default {
  props: {
    selectedBank: {
      type: String,
      required: true
    }
  },
  setup() {
    const { banks, id, addTransaction, updateTransactionStatus, addTransactionMessage } = useBankStorage();
    return {
      banks,
      id,
      addTransaction,
      updateTransactionStatus,
      addTransactionMessage
    };
  },
  data() {
    return {
      loggedIn: false,
      selectedUser: null,
      transferAmount: '',
      transferRecipient: ''
    };
  },
  computed: {
    selectedBankName() {
      return this.selectedBank.localeCompare('Bank USA') === 0 ? 'bankUSA' : 'bankEU';
    },
    nonSelectedBankName() {
      return this.selectedBank.localeCompare('Bank USA') === 0 ? 'bankEU' : 'bankUSA';
    },
    currencySymbol() {
      return this.selectedBank.localeCompare('Bank USA') === 0 ? '$' : '€';
    },
    notCurrencySymbol() {
      return this.selectedBank.localeCompare('Bank USA') === 0 ? '€' : '$';
    }
  },
  methods: {
    logIn() {
      this.loggedIn = true;
    },
    logOut() {
      this.selectedUser = null;
      this.transferAmount = '';
      this.transferRecipient = '';
      this.loggedIn = false;
    },
    async startTransaction() {
      if (this.transferAmount > 0 && this.transferAmount <= this.selectedUser.balance && this.transferRecipient.length !== 0) {
        const euWallet = new ethers.Wallet(this.banks.bankEU.privateKey);
        const usaWallet = new ethers.Wallet(this.banks.bankUSA.privateKey);
        const gatewayWallet = new ethers.Wallet(this.banks.gateway.privateKey);
        const wallets = [euWallet, usaWallet, gatewayWallet];

        // Initiate transaction
        this.selectedUser.balance -= this.transferAmount;

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
          sender: this.selectedUser,
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
