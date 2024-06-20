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
      <div class="grid grid-cols-4">
        <div class="col-span-4">
          <h3 class="text-xl font-semibold mb-2 text-gray-700">
            Transactions
          </h3>
          <div class="text-gray-500 h-72 overflow-auto w-full">
            <div
              v-for="(messages, index) in transactions"
              :key="index"
              class="mb-4"
            >
              <button
                class="text-gray-700 text-lg flex gap-x-1 items-center"
                @click="toggleTicket(index)"
              >
                <svg
                  v-if="expandedTickets.includes(index)"
                  class="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
                <svg
                  v-else
                  class="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                Ticket: <span class="font-semibold">{{ messages[0].ticketId }}</span>
              </button>
              <div v-if="expandedTickets.includes(index)">
                <div
                  v-if="messages && messages.length"
                  class="overflow-auto h-full"
                >
                  <table class="min-w-full bg-white border border-gray-300">
                    <thead class="sticky top-0 bg-gray-500 text-white cursor-default">
                      <tr>
                        <th
                          v-for="(value, key) in messages[0]"
                          :key="key"
                          class="py-2 px-4 border-b border-gray-200 whitespace-nowrap"
                        >
                          {{ key }}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(message, index) in messages"
                        :key="index"
                      >
                        <td
                          v-for="(value, key) in message"
                          :key="key"
                          class="py-2 px-4 border-b border-gray-200 text-center max-w-xs truncate hover:bg-gray-200 cursor-pointer"
                          :title="value"
                          @click="showDetails(value)"
                        >
                          {{ value }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <ModalView
      v-if="isModalOpen"
      class="text-gray-600"
      @close="isModalOpen = false"
    >
      <p>{{ selectedValue }}</p>
    </ModalView>
  </div>
</template>

<script>
import store from '~/store';

export default {
  data() {
    return {
      ...store,
      loggedIn: false,
      selectedBank: '',
      bankNames: [
        'Bank USA',
        'Bank EU'
      ],
      transactions: null,
      expandedTickets: [],
      isModalOpen: false
    };
  },
  computed: {
    bank() {
      return this.entities.find(obj => obj.name === this.selectedBank);
    },
  },
  methods: {
    async logIn() {
      if (this.selectedBank) {
        this.loggedIn = true;
        this.transactions = await getMessagesByEntityName(this.selectedBank);
      }
    },
    logOut() {
      this.loggedIn = false;
      this.selectedBank = '';
      this.transactions = null;
      this.expandedTickets = [];
    },
    toggleTicket(index) {
      if (this.expandedTickets.includes(index)) {
        this.expandedTickets = this.expandedTickets.filter(i => i !== index);
      } else {
        this.expandedTickets.push(index);
      }
    },
    formatAmount(amount, currency) {
      return `${currency}${amount}`;
    },
    showDetails(value) {
      this.selectedValue = value;
      this.isModalOpen = true;
    }
  }
};
</script>
