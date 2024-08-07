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
            {{ customer.currency }}{{ customer.balance.toFixed(2) }}
          </p>
          <h3 class="text-lg font-semibold mt-6 mb-2 text-gray-700">
            Transfer Money
          </h3>
          <input
            v-model.number="transferAmount"
            type="number"
            :placeholder="`Amount in ${bank.currency}`"
            class="w-full p-2 border rounded mb-2 text-gray-500"
            min="0"
            step="0.01"
            pattern="^\d*(\.\d{0,2})?$"
            @blur="formatTransferAmount"
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
            @click="transfer"
          >
            Transfer
          </button>
        </div>
        <div class="col-span-2 flex flex-col gap-y-1">
          <h3 class="text-lg font-semibold mb-2 text-gray-700">
            Transfers
          </h3>
          <div class="h-64 overflow-auto text-gray-600">
            <div
              v-for="(transaction, index) in selectedCustomerTransactions"
              :key="transaction.id"
            >
              <div
                v-if="customer.id === transaction.senderId"
                :class="['p-1 cursor-pointer opacity-75 hover:opacity-100', index % 2 === 0 ? 'bg-gray-100' : 'bg-gray-200']"
                @click="showDetails(transaction)"
              >
                <div class="flex justify-between items-center">
                  <img
                    src="/img/icons/money_sent.png"
                    class="h-5 w-5 rotate-180"
                  > 
                  <div>
                    {{ transaction.currencySent }}{{ transaction.amountSent.toFixed(2) }}
                  </div>
                  <img
                    v-if="transaction.status === 'completed'"
                    src="/img/icons/completed.png"
                    class="h-4 w-4"
                  > 
                  <img
                    v-else-if="transaction.status === 'failed'"
                    src="/img/icons/failed.png"
                    class="h-4 w-4"
                  > 
                  <span
                    v-else
                    class="flex items-center justify-center"
                  >
                    <svg
                      class="animate-spin h-4 w-4 text-blue-500"
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
                </div>
              </div>
              <div
                v-else-if="customer.id === transaction.receiverId"
                :class="['p-1 cursor-pointer opacity-75 hover:opacity-100', index % 2 === 0 ? 'bg-gray-100' : 'bg-gray-200']"
                @click="showDetails(transaction)"
              >
                <div class="flex justify-between items-center">
                  <img
                    src="/img/icons/money_received.png"
                    class="h-5 w-5"
                  > 
                  <div>
                    {{ transaction.currencyReceived }}{{ transaction.amountReceived.toFixed(2) }}
                  </div>
                  <img
                    v-if="transaction.status === 'completed'"
                    src="/img/icons/completed.png"
                    class="h-4 w-4"
                  > 
                  <img
                    v-else-if="transaction.status === 'failed'"
                    src="/img/icons/failed.png"
                    class="h-4 w-4"
                  > 
                  <span
                    v-else
                    class="flex items-center justify-center"
                  >
                    <svg
                      class="animate-spin h-4 w-4 text-blue-500"
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <ModalView
      v-if="isModalOpen"
      class="text-gray-700"
      @close="isModalOpen = false"
    >
      <div class="p-4">
        <h2 class="text-lg font-semibold mb-4">
          Transaction Details
        </h2>
        <table class="min-w-full bg-white border border-gray-200">
          <tbody>
            <tr>
              <td class="border px-4 py-2 font-semibold">
                Transaction ID
              </td>
              <td class="border px-4 py-2">
                {{ selectedTransaction.id }}
              </td>
            </tr>
            <tr>
              <td class="border px-4 py-2 font-semibold">
                Sender
              </td>
              <td class="border px-4 py-2">
                {{ getIban(selectedTransaction.senderId) }} <span class="text-sm">({{ getName(selectedTransaction.senderId) }})</span>
              </td>
            </tr>
            <tr>
              <td class="border px-4 py-2 font-semibold">
                Receiver
              </td>
              <td class="border px-4 py-2">
                {{ getIban(selectedTransaction.receiverId) }} <span class="text-sm">({{ getName(selectedTransaction.receiverId) }})</span>
              </td>
            </tr>
            <tr>
              <td class="border px-4 py-2 font-semibold">
                Amount Sent
              </td>
              <td class="border px-4 py-2">
                {{ selectedTransaction.currencySent }}{{ selectedTransaction.amountSent }}
              </td>
            </tr>
            <tr>
              <td class="border px-4 py-2 font-semibold">
                Amount Received
              </td>
              <td class="border px-4 py-2">
                {{ selectedTransaction.currencyReceived }}{{ selectedTransaction.amountReceived }}
              </td>
            </tr>
            <tr>
              <td class="border px-4 py-2 font-semibold">
                Status
              </td>
              <td class="border px-4 py-2">
                {{ selectedTransaction.status }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </ModalView>
  </div>
</template>

<script>
import store from "~/store";

export default {
  props: {
    selectedBank: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      ...store,
      loggedIn: false,
      selectedCustomer: '',
      transferAmount: '',
      transferRecipient: '',
      selectedTransactionId: null,
      isModalOpen: false
    };
  },
  computed: {
    bank() {
      return this.entities.find(obj => obj.name === this.selectedBank);
    },
    otherBank() {
      return  this.selectedBank.localeCompare('Bank USA') === 0 ? this.entities.find(obj => obj.name === 'Bank EU') : this.entities.find(obj => obj.name === 'Bank USA');
    },
    customer() {
      return this.customers.find(obj => obj.name === this.selectedCustomer);
    },
    gateway() {
      return this.entities.find(obj => obj.name === 'gateway');
    },
    availableCustomers() {
      return this.selectedBank.localeCompare('Bank USA') === 0 ? ['Alice', 'Charlie'] : ['Bob', 'Diana']
    },
    otherCustomers() {
      return this.selectedBank.localeCompare('Bank EU') === 0 ? ['Alice', 'Charlie'] : ['Bob', 'Diana']
    },
    otherCurrenncy() {
      return this.bank.currency.toString().localeCompare('$') === 0 ? '€' : '$';
    },
    selectedCustomerTransactions() {
      return this.transactions.filter(transaction => 
        transaction.senderId === this.customer.id || transaction.receiverId === this.customer.id
      ).reverse();
    },
    selectedTransaction() {
      return this.getTransaction(this.selectedTransactionId);
    }
  },
  methods: {
    formatTransferAmount() {
      this.transferAmount = parseFloat(this.transferAmount).toFixed(2);
    },
    showDetails(transaction) {
      this.selectedTransactionId = transaction.id;
      this.isModalOpen = true;
    },
    getIban(id) {
      return this.customers.find(obj => obj.id === id).iban;
    },
    getName(id) {
      return this.customers.find(obj => obj.id === id).name;
    },
    logIn() {
      this.loggedIn = true;
    },
    logOut() {
      this.selectedCustomer = '';
      this.transferAmount = '';
      this.transferRecipient = '';
      this.loggedIn = false;
    },
    async transfer() {
      // Check that a receiver is selected and the debtor has a high enough account balance
      if(this.transferAmount <= 0 || this.transferAmount >= this.customer.balance || this.transferRecipient.length === 0) {
        alert('Transaction could not be executed because the amount or the recipient was not valid.');
      }

      const hashes = [];
      const leafEncoding = ['string'];

      // Get Bank customers
      const debtor = this.customer;
      const creditor = this.customers.find(obj => obj.name === this.transferRecipient);

      const messageId = 21;

      const transactionData = { 
        messageId: messageId,
        senderId: debtor.id, 
        receiverId: creditor.id, 
        amountSent: this.transferAmount, 
        amountReceived: 0, 
        currencySent: debtor.currency, 
        currencyReceived: creditor.currency, 
        status: 'started' 
      };

      // Save transaction on the bank data base
      const transaction = await createTransaction(transactionData, 3001);
      const transactionId = transaction.transactionId;

      // Update the account balance of the debtor
      const newDebtorBalance = debtor.balance - this.transferAmount;
      await updateCustomerBalance(debtor.id, newDebtorBalance, 3001);

      // Update tables
      await this.queryData();

      const ticketId = await mintTicket(this.bank.name);

      // Create time stamp
      const date = new Date();

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');

      const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;

      // Create required execution date
      const lastHourLastSecondDate = new Date(date);
      lastHourLastSecondDate.setHours(23, 59, 59);

      const lastHours = String(lastHourLastSecondDate.getHours()).padStart(2, '0');
      const lastMinutes = String(lastHourLastSecondDate.getMinutes()).padStart(2, '0');
      const lastSeconds = String(lastHourLastSecondDate.getSeconds()).padStart(2, '0');

      const formattedLastHourLastSecondDate = `${year}-${month}-${day}T${lastHours}:${lastMinutes}:${lastSeconds}`;


      let messageArgs = {
        msgId: 'S-BU-001', // This is just an example value for the PoC
        creDtTm: formattedDate,
        nbOfTxs: '1',
        ctrlSum: this.transferAmount,
        initgPtyNm: debtor.name,
        pmtInfId: 'X-BA-PAY001', // This is just an example value for the PoC
        pmtMtd: 'TRF',
        pmtTpInfSvcLvlCd: 'NORM',
        reqdExctnDt: formattedLastHourLastSecondDate,
        dbtrNm: debtor.name,
        dbtrAcctIBAN: debtor.iban,
        dbtrAgtBICFI: debtor.currency === '$' ? 'BANKUS22' : 'BANKEU11',
        endToEndId: 'abc123', // This is just an example value for the PoC
        instdAmtCcy: debtor.currency === '$' ? 'USD' : 'EUR',
        instdAmt: this.transferAmount,
        cdtrAgtBICFI: debtor.currency === '$' ? 'BANKEU11' : 'BANKUS22',
        cdtrAcctIBAN: creditor.iban
      };

      let message = await createMessage('pain.001.001.12', messageArgs, ticketId, null, [this.bank.id, this.gateway.id], 3000);

      if(!message) {
        alert('Could not create message: pain.001.001.12');
      }

      hashes.push([message.messageHash]);
      let tree = buildMerkleTree(hashes, leafEncoding);

      await updateMerkleRoot(this.bank.name, ticketId, tree.root); 

      let parent = message.messageId;

      // Update transaction status to frowareded
      await updateTransactionStatus(transactionId, 'forwarded', 3001);

      // Update tables
      await this.queryData();

      const rateNumber = await getExchangeRate();

      const exchangeRate = debtor.currency === '$' ? (1 / rateNumber) : rateNumber; 

      const amountReceived = this.transferAmount * exchangeRate;

      messageArgs = {
        tradDt: formattedDate,
        orgtrRef: 'abc123', // This is just an example value for the PoC
        tradgSdIdAnyBIC: debtor.currency === '$' ? 'BANKUS22' : 'BANKEU11',
        ctrPtySdIdAnyBIC: 'FNSTAC11', // This is just an example value for the PoC
        tradgSdBuyAmtIdr: debtor.currency === '$' ? 'U8D4N2XJF' : 'R7H2JDXF3',
        tradgSdBuyAmtUnit: parseFloat(amountReceived).toFixed(2).toString(),
        tradgSdSellAmtIdr:  debtor.currency === '$' ? 'R7H2JDXF3' : 'U8D4N2XJF',
        tradgSdSellAmtUnit: this.transferAmount,
        sttlmDt: formattedLastHourLastSecondDate,
        xchgRate: exchangeRate.toString()
      };

      message = await createMessage('fxtr.014.001.05', messageArgs, ticketId, parent, [this.gateway.id, this.bank.id], 3000);

      if(!message) {
        alert('Could not create message: fxtr.014.001.05');
      }

      
      hashes.push([message.messageHash]);

      tree = buildMerkleTree(hashes, leafEncoding);

      await updateMerkleRoot(this.bank.name, ticketId, tree.root); 

      parent = message.messageId;
      
      await updateTransactionAmountReceived(transactionId, amountReceived, 3001);
      await updateTransactionStatus(transactionId, 'exchange rate set', 3001);

      // Update tables
      await this.queryData();

      messageArgs = {
        msgId: 'BU-FN-001', // This is just an example value for the PoC
        creDtTm: formattedDate,
        nbOfTxs: '1',
        ctrlSum: this.transferAmount,
        initgPtyNm: debtor.name,
        pmtInfId: 'BU-FN-PAY001', // This is just an example value for the PoC
        pmtMtd: 'TRF',
        pmtTpInfSvcLvlCd: 'NORM',
        reqdExctnDt: formattedLastHourLastSecondDate,
        dbtrNm: debtor.name,
        dbtrAcctIBAN: debtor.iban,
        dbtrAgtBICFI: debtor.currency === '$' ? 'BANKUS22' : 'BANKEU11',
        endToEndId: 'abc123', // This is just an example value for the PoC
        instdAmtCcy: debtor.currency === '$' ? 'USD' : 'EUR',
        instdAmt: this.transferAmount,
        cdtrAgtBICFI: debtor.currency === '$' ? 'BANKEU11' : 'BANKUS22',
        cdtrAcctIBAN: creditor.iban
      };

      message = await createMessage('pain.001.001.12', messageArgs, ticketId, parent, [this.bank.id, this.gateway.id], 3000);

      if(!message) {
        alert('Could not create message: pain.001.001.12');
      }

      hashes.push([message.messageHash]);
      tree = buildMerkleTree(hashes, leafEncoding); 

      await updateMerkleRoot(this.bank.name, ticketId, tree.root); 

      parent = message.messageId;

      await updateTransactionStatus(transactionId, 'transfering funds', 3001);

      // Update tables
      await this.queryData();

      messageArgs = {
        msgId: 'FN-BE-001', // This is just an example value for the PoC
        creDtTm: formattedDate,
        nbOfTxs: '1',
        ctrlSum: this.transferAmount,
        initgPtyNm: debtor.name,
        pmtInfId: 'FN-BE-PAY001', // This is just an example value for the PoC
        pmtMtd: 'TRF',
        pmtTpInfSvcLvlCd: 'NORM',
        reqdExctnDt: formattedLastHourLastSecondDate,
        dbtrNm: debtor.name,
        dbtrAcctIBAN: debtor.iban,
        dbtrAgtBICFI: debtor.currency === '$' ? 'BANKUS22' : 'BANKEU11',
        endToEndId: 'abc123', // This is just an example value for the PoC
        instdAmtCcy: debtor.currency === '$' ? 'USD' : 'EUR',
        instdAmt: this.transferAmount,
        cdtrAgtBICFI: debtor.currency === '$' ? 'BANKEU11' : 'BANKUS22',
        cdtrAcctIBAN: creditor.iban
      };

      message = await createMessage('pain.001.001.12', messageArgs, ticketId, parent, [this.gateway.id, this.otherBank.id], 3000);

      if(!message) {
        alert('Could not create message: pain.001.001.12');
      }

      hashes.push([message.messageHash]);
      tree = buildMerkleTree(hashes, leafEncoding);

      await updateMerkleRoot(this.bank.name, ticketId, tree.root); 

      parent = message.messageId;

      const proof = createProof(tree, [message.messageHash]);
      const leaf = calculateLeafHash(tree, [message.messageHash])

      await transferFunds(debtor, this.bank.address, this.otherBank.address, amountReceived, ticketId, leaf, proof);

      messageArgs = {
        msgId: 'BANKUS33-20240504-124500-001', // This is just an example value for the PoC
        creDtTm: formattedDate,
        orgnlMsgId: 'S-BU-001', // This is just an example value for the PoC
        orgnlMsgNmId: 'pain.001.001.12',
        orgnlEndToEndId: 'abc123',
        txSts: 'ACCP'
      };

      message = await createMessage('pacs.002.001.14', messageArgs, ticketId, parent, [this.otherBank.id, this.gateway.id, this.bank.id], 3000);

      if(!message) {
        alert('Could not create message: pacs.002.001.14');
      }

      hashes.push([message.messageHash]);
      tree = buildMerkleTree(hashes, leafEncoding);

      await updateMerkleRoot(this.bank.name, ticketId, tree.root); 

      const newCreditorBalance = creditor.balance + amountReceived;
      await updateCustomerBalance(creditor.id, newCreditorBalance, 3001);

      await updateTransactionStatus(transactionId, 'completed', 3001);

      // Reset values
      this.transferAmount = '';
      this.transferRecipient = '';

      await this.queryData();
    }
  }
};
</script>
