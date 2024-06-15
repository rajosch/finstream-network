<template>
  <div class="flex flex-col items-center justify-center py-10">
    <div
      v-if="!loggedIn"
      class="w-full max-w-md p-8 bg-white rounded shadow-lg"
    >
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
      <div class="text-gray-700 text-lg font-semibold flex items-center gap-x-5 mb-5">
        {{ bank.name }}
        <span class="text-sm font-normal">
          {{ bank.address }}
        </span>
      </div>
      <div class="absolute top-4 right-4 text-gray-700">
        <button
          class="ml-4 text-red-500"
          @click="logOut"
        >
          Log Out
        </button>
      </div>
      <div class="grid grid-cols-2">
        <div>
          <h3 class="text-xl font-semibold mb-2 text-gray-700">
            Transactions
          </h3>
          <div class="text-gray-500 h-72 overflow-auto w-full">
            TODO DISPLAY TRANSACTIONS
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
export default {
    async setup() {
      const banks = await getData('entities');
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
      bank() {
        return this.banks.find(obj => obj.name === this.selectedBank);
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
