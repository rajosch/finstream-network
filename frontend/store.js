import { reactive, toRefs } from "vue";
import { getData } from "./composables/useApi";

const state = reactive({
  messages: null,
  entities: null,
  messageEntities: null,
  customers: null,
  transactions: null,
  contracts: null
});

async function queryData() {
  state.entities = await getData('entities', 3000);
  state.messages = await getData('messages', 3000);
  state.messageEntities = await getData('messageEntities', 3000);
  state.contracts = await getData('contracts', 3000);
  state.customers = await getData('customers', 3001);
  state.transactions = await getData('transactions', 3001);
}

function getTable(table) {
  return state[table];
}

function getTransaction(id) {
  return state.transactions.find(obj => obj.id === id);
}

export default {
  ...toRefs(state),
  queryData,
  getTable,
  getTransaction
};