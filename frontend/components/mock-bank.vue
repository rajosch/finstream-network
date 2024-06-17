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
        <div class="col-span-2">
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
        <div class="col-span-3 flex flex-col gap-y-1 h-84 overflow-auto">
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
import store from "~/store";

export default {
  props: {
    selectedBank: {
      type: String,
      required: true
    }
  },
  async setup() {
    const EUBank = store.EUBank;
    const USABank = store.USABank;
    const EUCustomers = store.EUCustomers;
    const USACustomers = store.USACustomers;
    return { EUBank, USABank, EUCustomers, USACustomers };
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
      if(this.transferAmount <= 0 || this.transferAmount >= this.customer.balance || this.transferRecipient.length === 0) {
        alert('Transaction could not be executed because the amount or the recipient was not valid.');
      }

      // Get Bank customers
      const debtor = this.customer;
      const creditor = this.customers.find(obj => obj.name === to);

      // Get entity wallets
      const euWallet = new ethers.Wallet((this.banks.find(obj => obj.name === 'EU Bank')).privateKey);
      const usaWallet = new ethers.Wallet((this.banks.find(obj => obj.name === 'USA Bank')).privateKey);
      const gatewayWallet = new ethers.Wallet((this.banks.find(obj => obj.name === 'gateway')).privateKey);
      const wallets = [euWallet, usaWallet, gatewayWallet];

      // 1. Debit debtor account
      const newDebtorAmount = debtor.balance - this.transferAmount;
      await updateCustomerBalance(debtor.id, newDebtorAmount);


      // 1.1. Update 'customer-transaction' table
      /**
       * TODO
       * just show for sender 
       * status 'transfer-initiated'
       */


      // 2. Mint transaction ticket
      /**
       * TODO mint ticket and wait for response to get ticket id
       * const ticketId = await controller.mintTicket(...);
       */
      const ticketId = 'ticketId';

      // 3. Create first message (pain.001.001.12 - debtor to bank) and save it to database
      const messageId = await createMessage(
        'pain.001.001.12', 
        wallets, 
        {}, // TODO get message args
        ticketId,
        {}, // TODO handle xsd content on server side
        {}, // TODO handle proto content on server side
        null
      );

      // 4. create merkle root
      /**
       * TODO set up merkle root creation on gateway
       */
      let merkleRoot = undefined;

      // 5. update merkle root on chain
      /**
       * await updateMerkleRoot(tokenId, merkleRoot);
       */

      // 6. Update customer transaction status to 'forwarded'

      await this.sleep(500);

      // 7. Query exchange rate
      const exchangeRate = 0.9; // TODO await getExchangeRate(...)

      // 8. Create second message (fxtr.014.001.05 - gateway to bank) and save it to database
      await createMessage(
        'fxtr.014.001.05', 
        wallets, 
        {}, // TODO get message args
        ticketId,
        {}, // TODO handle xsd content on server side
        {}, // TODO handle proto content on server side
        messageId
      );

      // 9. Update merkle root and save it on-chain
      merkleRoot = undefined; // TODO
      // await updateMerkleRoot(tokenId, mekleRoot);

      // 10. Update customer transaction status to 'exchange rate set'

      await this.sleep(500);

      // 11. Create third message (pain.001.001.12 - bank to gateway)
      await createMessage(
        'pain.001.001.12', 
        wallets, 
        {}, // TODO get message args
        ticketId,
        {}, // TODO handle xsd content on server side
        {}, // TODO handle proto content on server side
        messageId
      );

      // 12. Update merkle root and save it on-chain
      merkleRoot = undefined; // TODO
      // await updateMerkleRoot(tokenId, mekleRoot);

      
      // 13. Transfer funds
      // TODO call to treasury to transfer funds from one bank to the other

      // 14. Update customer transaction status to 'transfering funds'

      await this.sleep(500);

      // 15. Create 4th message (pain.001.001.12 - gateway to second bank)
      await createMessage(
        'pain.001.001.12', 
        wallets, 
        {}, // TODO get message args
        ticketId,
        {}, // TODO handle xsd content on server side
        {}, // TODO handle proto content on server side
        messageId
      );

      // 16. Update merkle root and save it on-chain
      merkleRoot = undefined; // TODO
      // await updateMerkleRoot(tokenId, mekleRoot);

      await this.sleep(500);

      // 17. Create 5th message (pain.001.001.12 - gateway to second bank)
      await createMessage(
        'pacs.002.001.14', 
        wallets, 
        {}, // TODO get message args
        ticketId,
        {}, // TODO handle xsd content on server side
        {}, // TODO handle proto content on server side
        messageId
      );

      // 18. Update merkle root and save it on-chain
      merkleRoot = undefined; // TODO
      // await updateMerkleRoot(tokenId, mekleRoot);


      // 19. Debit debtor account
      const newCreditorAmount = creditor.balance - this.transferAmount;
      await updateCustomerBalance(creditor.id, newCreditorAmount);

      // 20. Update customer transaction status to 'completed' + include the receiver too now (showcases as funds received in their UI)
      // TODO update merkle root on chain

      // Reset values
      this.transferAmount = '';
      this.transferRecipient = '';
    },
    async sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  }
};
</script>
