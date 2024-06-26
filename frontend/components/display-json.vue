<template>
  <div>
    <ul>
      <li
        v-for="(value, key) in jsonObject"
        :key="key"
      >
        <span v-if="typeof value === 'object'">
          <span class="font-semibold">{{ key }}</span>
          <DisplayJson
            :json-object="value"
            class="pl-2"
            @update-json="updateJson(key, $event)"
          />
        </span>
        <span v-else>
          <span class="font-semibold mr-1">{{ key }}:</span>
          <input
            v-model="jsonObject[key]"
            type="text"
            class="border rounded px-1"
            @input="emitUpdate"
          >
        </span>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  props: {
    jsonObject: {
      type: Object,
      required: true
    }
  },
  emits: [
    'update-json'
  ],
  watch: {
    jsonObject: {
      handler() {
        this.emitUpdate();
      },
      deep: true
    }
  },
  methods: {
    emitUpdate() {
      this.$emit('update-json', this.jsonObject);
    },
    updateJson(key, value) {
      this.jsonObject[key] = value;
      this.emitUpdate();
    }
  }
};
</script>
