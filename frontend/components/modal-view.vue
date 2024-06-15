<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    @click.self="close"
  >
    <div class="bg-white p-6 rounded shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
      <div>
        <slot />
      </div>
    </div>
  </div>
</template>
  
<script>
export default {
  emits: ['close'],
  methods: {
    close() {
      this.$emit('close');
    }
  }
};
</script>
