<template>
  <div class="p-4 text-gray-500">
    <div>
      <DisplayJson
        :json-object="jsonData"
        @update-json="handleJsonUpdate"
      />
    </div>
    <div class="w-full flex justify-center mt-8">
      <button
        v-if="hasChanges"
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        @click="updateMessage"
      >
        Update Message
      </button>
    </div>
  </div>
</template>
  
<script>
export default {
  props: {
    initialJson: {
      type: Object,
      required: true
    }
  },
  emits: [
    'message-update'
  ],
  data() {
    return {
      jsonData: JSON.parse(JSON.stringify(this.initialJson)),
      hasChanges: false
    };
  },
  watch: {
    jsonData: {
      handler() {
        this.hasChanges = true;
      },
      deep: true
    }
  },
  methods: {
    handleJsonUpdate(updatedJson) {
      this.jsonData = updatedJson;
    },
    updateMessage() {
      this.hasChanges = false;
      this.$emit('message-update', this.jsonData);
    }
  }
};
</script>
