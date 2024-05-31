<template>
  <div class="flex flex-col items-center justify-center py-10">
    <div
      v-if="!loggedIn"
      class="w-full max-w-md p-8 bg-white rounded shadow-lg"
    >
      <h2 class="text-2xl font-bold mb-4 text-center text-gray-700">
        Finstream Dashboard
      </h2>
      <label
        for="bank-select"
        class="block text-lg mb-2 text-gray-500"
      >Select Bank:</label>
      <select
        id="bank-select"
        v-model="selectedBank"
        class="w-full p-2 border rounded mb-4 text-gray-500"
      >
        <option
          disabled
          value=""
        >
          Choose a bank
        </option>
        <option
          v-for="name in bankNames"
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
    <div
      v-else
      class="w-2/3 max-w-5xl p-8 bg-white rounded shadow-lg relative"
    >
      <div class="absolute top-4 left-4 text-gray-700 text-lg font-semibold">
        {{ selectedBank }}
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
        Finstream Dashboard
      </h2>
      <div class="grid grid-cols-2">
        <div class="bg-red-200">
          <h3 class="text-xl font-semibold mb-2 text-gray-700">
            Transactions
          </h3>
          <div class="text-gray-500 h-72 overflow-auto w-full">
            <div 
              v-for="transaction in banks[selectedBankName].transactions"
              :key="transaction.id"
            >
              <div class="flex gap-x-2 cursor-pointer">
                <ChevronRightIcon class="h-5 w-5" />
                <ChevronDownIcon class="h-5 w-5" />
                {{ transaction.id }}
                <div
                  :title="transaction.status" 
                >
                  <DotsHorizontalIcon
                    v-if="transaction.status.localeCompare('pending') === 0"
                    class="h-6 w-6" 
                  />
                  <XIcon
                    v-if="transaction.status.localeCompare('failed') === 0"
                    class="h-6 w-6" 
                  />
                  <CheckIcon
                    v-if="transaction.status.localeCompare('completed') === 0"
                    class="h-6 w-6" 
                  />
                </div>
              </div>
              <div class="ml-5">
                <div>
                  Sender: {{ transaction.sender.name }}
                </div>
                <div>
                  Recipient: {{ transaction.recipient.name }}
                </div>
                <div>
                  Messages
                  <div 
                    v-for="message in transaction.messages"
                    :key="message"
                  >
                    {{ message }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <h3 class="text-xl font-semibold mb-2 text-gray-700">
            Total Sent / Received
          </h3>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useBankStorage } from '@/composables/localStorage';
import { DotsHorizontalIcon, XIcon, CheckIcon, ChevronRightIcon, ChevronDownIcon } from '@heroicons/vue/outline';

export default {
    components: {
      DotsHorizontalIcon,
      XIcon,
      CheckIcon, 
      ChevronRightIcon, 
      ChevronDownIcon
    },
    setup() {
        const { banks } = useBankStorage();
        return { banks };
    },
    data() {
      return {
        loggedIn: false,
        selectedBank: '',
        bankNames: [
          'Bank USA',
          'Bank EU'
        ],
      };
    },
    computed: {
      currencySymbol() {
        return this.selectedBank.localeCompare('Bank USA') === 0 ? '$' : '€';
      },
      selectedBankName() {
        return this.selectedBank.localeCompare('Bank USA') === 0 ? 'bankUSA' : 'bankEU';
      },
    },
    methods: {
      logIn() {
        if (this.selectedBank) {
          this.loggedIn = true;
        }
      },
      logOut() {
        this.loggedIn = false;
        this.selectedBank = '';
      },
      formatAmount(amount, currency) {
        return `${currency}${amount}`;
      }
    }
};
</script>
