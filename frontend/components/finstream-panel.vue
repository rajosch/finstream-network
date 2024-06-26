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
      <div class="text-gray-700 text-lg font-semibold mb-5">
        {{ bank.name }}
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
              :class="['py-2 px-2 cursor-pointer', index % 2 === 0 ? 'bg-gray-100' : 'bg-gray-200']"
              @click="toggleTicket(index)"
            >
              <div class="flex justify-between mb-1">
                <div
                  class="text-gray-700 text-lg flex gap-x-1 items-center"
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
                </div>
                <button 
                  v-if="expandedTickets.includes(index)"
                  class="text-lg border border-green-300 p-1 text-green-400 rounded-md bg-white bg-opacity-25 hover:bg-opacity-100 hover:text-green-500" 
                  @click.stop="verifyMessages(messages)"
                >
                  Verify
                </button>
              </div>
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
                          @click.stop="showDetails(value)"
                        >
                          <span
                            v-if="value === 'checking validity'"
                            class="flex items-center justify-center"
                          >
                            <svg
                              class="animate-spin h-5 w-5 text-blue-500"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                class="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                stroke-width="4"
                              />
                              <path
                                class="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          </span>
                          <span
                            v-else-if="value === 'verified'"
                            class="text-green-500"
                          >Verified</span>
                          <span
                            v-else-if="value === 'corrupted'"
                            class="text-red-500"
                          >Corrupted</span>
                          <span v-else>{{ truncatedValue(value) }}</span>
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
      <p>
        {{ selectedValue }}
      </p>
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
      isModalOpen: false,
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
    truncatedValue(value) {
      return value && value.length > 20 ? value.substring(0, 20) + '...' : value;
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
    },
    async verifyMessages(messages) {
      const newStates = [];
      for(let i = 0; i < messages.length; i++) {
        console.log("Verifyfing message: ", messages[i].id);
        messages[i].verified = 'checking validity';

        const response = await verifyMessage(messages[0].ticketId, messages[i].messageHash, 3000);

        console.log(response);

        await this.sleep(1000);

        let newState = 'undefined';

        if(response.result) {
          newState = 'verified';
        }else {
          newState = 'corrupted'
          alert(response.message);
        }

        messages[i].verified = newState;
        newStates.push(newState);
      }      

      for(let i = 0; i < messages.length; i++) {
        await updateMessageVerificationState(messages[i].id, newStates[i], 3000);
      } 
      
      await this.queryData();
      this.transactions = await getMessagesByEntityName(this.selectedBank);
    },
    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  }
};
</script>
