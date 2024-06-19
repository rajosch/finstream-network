<template>
  <div class="bg-slate-700 text-gray-300">
    <header
      class="bg-slate-800 text-gray-300 fixed top-0 w-full z-50 transition-all duration-300"
      :class="{'bg-opacity-50': isTransparent}"
    >
      <nav class="container mx-auto px-4 py-2 flex justify-between items-center">
        <NuxtLink
          to="/"
          class="w-1/3"
        >
          <div class="text-2xl font-bold">
            Finstream Network
          </div>
        </NuxtLink>
        <ul class="flex space-x-4 w-1/3 justify-center">
          <NuxtLink
            to="#about"
            class="opacity-75 hover:opacity-100"
          >
            Learn More
          </NuxtLink>
          <NuxtLink
            to="#poc"
            class="opacity-75 hover:opacity-100"
          >
            Try PoC
          </NuxtLink>
        </ul>
        <ul class="flex space-x-4 w-1/3 justify-end">
          <NuxtLink
            to="https://github.com/rajosch/finstream-network"
            target="_blank"
          >
            <img
              src="/img/logo/github.svg"
              class="border rounded-full h-7 w-7 p-1 hover:opacity-100 opacity-70"
            >
          </NuxtLink>
        </ul>
      </nav>
    </header>
    <main>
      <NuxtPage />
    </main>
  </div>
</template>

<script>
import store from '~/store';
export default {
  async setup() {
    await store.queryData();
  },
  data() {
    return {
      isTransparent: false,
    };
  },
  mounted() {
    window.addEventListener('scroll', this.handleScroll);
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  },
  methods: {
    handleScroll() {
      this.isTransparent = window.scrollY > 50;
    },
  },
};
</script>

<style>
  html {
    scroll-behavior: smooth;
  }
</style>
