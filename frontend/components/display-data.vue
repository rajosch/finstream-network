<template>
  <div class="text-black cursor-default">
    <section
      id="data"
      class="h-[60vh]"
    >
      <div
        v-if="data && data.length"
        class="overflow-auto h-full"
      >
        <table class="min-w-full bg-white border border-gray-300">
          <thead class="sticky top-0 bg-gray-800 text-white">
            <tr>
              <th
                v-for="(value, key) in data[0]"
                :key="key"
                class="py-2 px-4 border-b border-gray-200 whitespace-nowrap"
              >
                {{ key }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, index) in data"
              :key="index"
            >
              <td
                v-for="(value, key) in item"
                :key="key"
                class="py-2 px-4 border-b border-gray-200 text-center max-w-xs truncate hover:bg-gray-200"
                :title="value"
                @click="showDetails(value)"
              >
                {{ value }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else>
        <p>No data available.</p>
      </div>
    </section>
    <ModalView
      v-if="isModalOpen"
      @close="isModalOpen = false"
    >
      <p>{{ selectedValue }}</p>
    </ModalView>
  </div>
</template>

<script>
import store
 from '~/store';
export default {
  props: {
    table: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      ...store,
      isModalOpen: false
    };
  },
  computed: {
    data() {
      return this.getTable(this.table);
    }
  },
  methods: {
    showDetails(value) {
      this.selectedValue = value;
      this.isModalOpen = true;
    }
  }
};
</script>

<style scoped>
.max-w-xs {
  max-width: 20rem;
}
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>