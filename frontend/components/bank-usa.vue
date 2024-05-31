<template>
    <div class="flex flex-col items-center justify-center py-10">
        <div v-if="!loggedIn" class="w-full max-w-md p-8 bg-white rounded shadow-lg">
            <h2 class="text-2xl font-bold mb-4 text-center">BANK USA</h2>
            <label for="user-select" class="block text-lg mb-2">Select User:</label>
            <select id="user-select" v-model="selectedUser" class="w-full p-2 border rounded mb-4">
                <option disabled value="">Choose a user</option>
                <option v-for="user in americanUsers" :key="user.name" :value="user.name">{{ user.name }}</option>
            </select>
            <button @click="logIn" class="w-full bg-blue-500 text-white p-2 rounded">Log In</button>
        </div>
        <div v-else class="w-full max-w-4xl p-8 bg-white rounded shadow-lg relative">
            <div class="absolute top-4 right-4 text-gray-700">Logged in as: {{ selectedUser }} <button @click="logOut" class="ml-4 text-red-500">Log Out</button></div>
            <h2 class="text-2xl font-bold mb-4 text-center">BANK USA</h2>
            <div class="flex justify-between mb-6">
                <div>
                    <h3 class="text-xl font-semibold mb-2">Account Balance</h3>
                    <p class="text-lg">{{ accountBalance }}</p>
                    <h3 class="text-xl font-semibold mt-6 mb-2">Transfer Money</h3>
                    <input v-model="transferAmount" type="number" placeholder="Amount" class="w-full p-2 border rounded mb-2" min="0" />
                    <label for="recipient-select" class="block text-lg mb-2">Select Recipient:</label>
                    <select id="recipient-select" v-model="transferRecipient" class="w-full p-2 border rounded mb-4">
                        <option disabled value="">Choose a recipient</option>
                        <option v-for="user in europeanUsers" :key="user.name" :value="user.name">{{ user.name }}</option>
                    </select>
                    <button @click="makeTransfer" class="w-full bg-green-500 text-white p-2 rounded">Transfer</button>
                </div>
                <div>
                    <h3 class="text-xl font-semibold mb-2">Past Transfers</h3>
                    <ul class="list-disc list-inside">
                        <li v-for="(transfer, index) in pastTransfers" :key="index">
                            {{ transfer.amount }} to {{ transfer.recipient }}
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            loggedIn: false,
            selectedUser: '',
            americanUsers: [
                { name: 'Alice' },
                { name: 'Charlie' }
            ],
            europeanUsers: [
                { name: 'Bob' },
                { name: 'Diana' }
            ],
            accountBalance: '$5,000',
            transferAmount: '',
            transferRecipient: '',
            pastTransfers: [
                { amount: '$200', recipient: 'Bob' },
                { amount: '$150', recipient: 'Diana' }
            ]
        };
    },
    methods: {
        logIn() {
            if (this.selectedUser) {
                this.loggedIn = true;
            }
        },
        logOut() {
            this.loggedIn = false;
            this.selectedUser = '';
        },
        makeTransfer() {
            if (this.transferAmount > 0 && this.transferRecipient) {
                this.pastTransfers.push({
                    amount: `$${this.transferAmount}`,
                    recipient: this.transferRecipient
                });
                this.transferAmount = '';
                this.transferRecipient = '';
            } else {
                alert("Please enter a positive amount and select a recipient.");
            }
        }
    }
};
</script>
