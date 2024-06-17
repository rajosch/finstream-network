import { reactive, toRefs } from "vue";
import { getData } from "./composables/useApi";

const state = reactive({
  EUBank: null,
  USABank: null,
  EUCustomers: [],
  USACustomers: [],
  selectedCurrency: '$',
});

async function queryData() {
  const banks = await getData('entities');
  const customers = await getData('customers')
  state.EUBank = banks.find(obj => obj.name === 'EU Bank');
  state.USABank = banks.find(obj => obj.name === 'USA Bank');
  state.EUCustomers.push(customers.find(obj => obj.name === 'Bob'));
  state.EUCustomers.push(customers.find(obj => obj.name === 'Diana'));
  state.USACustomers.push(customers.find(obj => obj.name === 'Alice'));
  state.USACustomers.push(customers.find(obj => obj.name === 'Charlie'));
}


export default {
  ...toRefs(state),
  queryData
};