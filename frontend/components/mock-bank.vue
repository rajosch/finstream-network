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

  export default {
    props: {
      selectedBank: {
        type: String,
        required: true
      }
    },
    setup() {
      const { banks, id, addTransaction, updateTransactionStatus, incrementId } = useBankStorage();
      return {
        banks,
        id,
        addTransaction,
        updateTransactionStatus,
        incrementId
      }
    },
    data() {
      return {
        loggedIn: false,
        selectedUser: null,
        transferAmount: '',
        transferRecipient: ''
      }
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
          // Initiate transaction
          this.selectedUser.balance -= this.transferAmount;
          const transaction = {
            id: Date.now(),
            amount: this.transferAmount,
            recipient: this.transferRecipient,
            sender: this.selectedUser,
            status: 'initiated',
            messages: [
              {
                "encryptedData": "215,243,208,96,244,242,230,206,164,19,217,107,6,158,65,8,109,40,198,16,103,5,96,79,21,138,247,38,49,137,99,206,14,250,242,37,106,84,106,147,142,62,70,145,124,80,0,69,223,142,31,139,42,189,237,162,91,165,185,217,215,76,85,71,137,50,120,218,18,176,180,114,125,159,231,212,141,12,145,70,149,214,20,165,109,56,136,114,180,105,251,69,100,253,186,196,244,62,232,125,12,148,165,166,119,64,97,7,252,151,153,113,66,155,204,56,11,194,62,112,115,122,51,165,14,213,78,70,197,253,209,74,114,104,202,211,163,99,108,164,231,171,37,152,253,108,121,185,107,224,31,52,3,102,159,129,237,135,10,126,127,198,117,185,133,222,249,79,109,198,84,57,59,78,190,108,27,90,224,246,91,27,12,59,37,197,236,250,238,245,206,195,159,33,3,160,254,78,52,238,132,7,132,45,172,242,41,120,255,99,37,105,187,42,80,99,193,34,64,108,93,131,227,203,222,164,36,158,117,138,219,255,162,116,232,232,77,212,151,19,170,204,22,205,126,194,205,190,171",
                "symmetricKey": [
                  {
                    "encryptedKey": "185,92,97,255,87,97,232,36,142,77,59,197,116,191,64,101",
                    "iv": "15,205,143,12,154,72,153,113,2,242,42,158,19,152,128,72",
                    "salt": "30,135,120,216,55,9,48,110,44,158,188,171,77,166,180,253",
                    "publicKey": "0x021a2a70bcdd83d6eda9d56962db0f6f4fec5f67f2c63ac959462f879b744dbd5c"
                  },
                  {
                    "encryptedKey": "190,169,30,91,45,212,160,156,232,200,62,138,230,195,149,173",
                    "iv": "205,195,159,1,68,175,131,140,95,125,131,237,79,110,133,82",
                    "salt": "131,162,159,233,95,150,32,219,85,180,177,67,186,14,1,39",
                    "publicKey": "0x0200874f83122cffbfe9e6c14c82fc774e38f5007b0bea41663c8247b53bd0462a"
                  },
                  {
                    "encryptedKey": "182,19,55,131,4,106,216,87,105,213,167,151,247,213,58,187",
                    "iv": "39,78,81,4,51,70,77,132,38,249,39,195,6,160,130,66",
                    "salt": "207,96,123,236,151,148,124,130,83,242,149,251,246,24,99,68",
                    "publicKey": "0x0257993086decd73f15cf7aa0d5c0a6c1cfc9769c05124b291bbb8d49992e6a207"
                  }
                ],
                "iv": "118,254,178,160,212,76,169,83,30,203,83,117,204,75,192,161",
                "messageHash": "0x28038c17e41a06bf2635d63f7e492ec412a7148ffa04e4068974baba2bab5312",
                "ticketId": "ticketId",
                "parent": null
              }
            ]
          };

          this.addTransaction(this.selectedBankName, transaction);

          await this.sleep(500);

          // Forward transaction to Finstream gateway
          this.updateTransactionStatus(this.selectedBankName, transaction.id, 'forwarded');
          // TODO add second pain message

          await this.sleep(500);
          // Get exchange rate from the Chainlink price feed
          this.updateTransactionStatus(this.selectedBankName, transaction.id, 'set exchange rate');
          // TODO add first fxtr message

          await this.sleep(500);
          // Bank accepts exchange rate
          this.updateTransactionStatus(this.selectedBankName, transaction.id, 'accept exchange rate');
          const exchangeRate = 0.9; // TODO update query exchange rate from chain 

          await this.sleep(500);
          // Native currency exchanged for target currency
          // TODO call controller to start transfer
          this.updateTransactionStatus(this.selectedBankName, transaction.id, 'transfer');
          // TODO add third pain message

          // TODO add transaction hash to transaction object 
          await this.sleep(500);
          // Money sent
          this.updateTransactionStatus(this.selectedBankName, transaction.id, 'sent');
          // TODO add fourth pain message

          await this.sleep(500);
          // Transaction completed
          this.updateTransactionStatus(this.selectedBankName, transaction.id, 'completed');
          // TODO add pacs message
          this.transferRecipient.balance += this.transferAmount * exchangeRate; // adjust calculation depending on switch direction
        } else {
          alert("Please enter a positive amount and select a recipient.");
        }

        this.transferAmount = '';
        this.transferRecipient = '';
      },
      async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
      }
    }
  }
</script>