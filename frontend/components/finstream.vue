<template>
    <div class="flex flex-col items-center justify-center py-10">
        <div v-if="!loggedIn" class="w-full max-w-md p-8 bg-white rounded shadow-lg">
            <h2 class="text-2xl font-bold mb-4 text-center">FINSTREAM Admin Dashboard</h2>
            <label for="bank-select" class="block text-lg mb-2">Select Bank:</label>
            <select id="bank-select" v-model="selectedBank" class="w-full p-2 border rounded mb-4">
                <option disabled value="">Choose a bank</option>
                <option v-for="bank in banks" :key="bank.name" :value="bank.name">{{ bank.name }}</option>
            </select>
            <button @click="logIn" class="w-full bg-blue-500 text-white p-2 rounded">Log In</button>
        </div>
        <div v-else class="w-2/3 max-w-5xl p-8 bg-white rounded shadow-lg relative">
            <div class="absolute top-4 right-4 text-gray-700">Logged in as: {{ selectedBank }} <button @click="logOut" class="ml-4 text-red-500">Log Out</button></div>
            <h2 class="text-2xl font-bold mb-4 text-center">FINSTREAM Admin Dashboard</h2>
            <div class="flex justify-between mb-6">
                <div>
                    <h3 class="text-xl font-semibold mb-2">Active Transactions</h3>
                    <ul class="list-disc list-inside">
                        <li v-for="(transaction, index) in activeTransactions" :key="index">
                            {{ formatAmount(transaction.amount, transaction.currency) }} from {{ transaction.sender }} to {{ transaction.receiver }} - {{ transaction.status }}
                        </li>
                    </ul>
                </div>
                <div>
                    <h3 class="text-xl font-semibold mb-2">Total Sent / Received</h3>
                    <p class="text-lg">Sent: {{ formatAmount(totalSent, '$') }}</p>
                    <p class="text-lg">Received: {{ formatAmount(totalReceived, '€') }}</p>
                    <h3 class="text-xl font-semibold mt-6 mb-2">Debt</h3>
                    <p class="text-lg">{{ formatAmount(debt, selectedBank === 'Bank USA' ? '$' : '€') }}</p>
                    <button @click="repayBorrowedMoney" class="w-full bg-red-500 text-white p-2 rounded mt-4">Repay Borrowed Money</button>
                </div>
            </div>
            <div class="mb-6">
                <h3 class="text-xl font-semibold mb-2">Transactions Facilitated</h3>
                <ul class="list-disc list-inside">
                    <li v-for="(transaction, index) in transactions" :key="index">
                        {{ formatAmount(transaction.amount, transaction.currency) }} from {{ transaction.sender }} to {{ transaction.receiver }}
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            loggedIn: false,
            selectedBank: '',
            banks: [
                { name: 'Bank USA' },
                { name: 'Bank EU' }
            ],
            transactions: [
                { amount: 200, sender: 'Bank USA', receiver: 'Bank EU', currency: '$' },
                { amount: 150, sender: 'Bank EU', receiver: 'Bank USA', currency: '€' }
            ],
            totalSent: 350,
            totalReceived: 150,
            debt: 500,
            activeTransactions: [
                { amount: 100, sender: 'Bank USA', receiver: 'Bank EU', status: 'Pending', currency: '$' },
                { amount: 50, sender: 'Bank EU', receiver: 'Bank USA', status: 'Processing', currency: '€' }
            ]
        };
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
        repayBorrowedMoney() {
            alert('Borrowed money repaid.');
        },
        formatAmount(amount, currency) {
            return `${currency}${amount}`;
        }
    }
};
</script>
