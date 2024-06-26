<template>
  <div class="min-h-screen flex flex-col">
    <section class="bg-slate-900 text-white py-20 h-[50vh] flex items-center justify-center">
      <div class="container mx-auto px-4 text-center">
        <h1 class="text-4xl md:text-7xl font-bold mb-4">
          Finstream Network
        </h1>
        <p class="mb-12 text-lg md:text-2xl">
          Integrating Web 3 With Traditional Finance
        </p>
        <div class="flex justify-center gap-x-8">
          <NuxtLink
            to="#about"
            class="text-lg bg-orange-300 text-orange-400 py-2 px-4 rounded-md bg-opacity-20 border border-orange-400 hover:bg-opacity-40"
          >
            Learn More
          </NuxtLink>
          <NuxtLink
            to="#poc"
            class="text-lg bg-gray-300 text-gray-400 py-2 px-4 rounded-md bg-opacity-20 border border-gray-400 hover:bg-opacity-40"
          >
            Try PoC
          </NuxtLink>
        </div>
      </div>
    </section>

    <section
      id="about"
      class="p-10 lg:px-56 h-[75vh] flex flex-col justify-center"
    >
      <h2 class="text-2xl md:text-4xl font-bold mb-4 text-center">
        What is Finstream Network?
      </h2>
      <p class="text-lg md:text-xl mb-8 text-center">
        Finstream is designed to facilitate seamless cross-border payments using blockchain technology. It provides a secure, efficient, and transparent way to transfer money internationally.
      </p>
      <div class="flex justify-center h-1/2">
        <div class="aspect-w-16 aspect-h-9 w-full max-w-2xl">
          <!-- UPDATE VIDEO ID! -->
          <iframe
            class="w-full h-full rounded-lg shadow-lg"
            src="https://www.youtube.com/embed/kvPkgd6eQKU"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          />
        </div>
      </div>
    </section>

    <section>
      <div class="bg-gray-800 text-white py-4">
        <div class="container mx-auto flex justify-between items-center px-4">
          <h1 class="text-2xl font-bold">
            Message Storage & Verification
          </h1>
        </div>
      </div>
      <div class="bg-gray-300 h-[60vh]">
        <div class="w-full">
          <MessageValidation />
        </div>
      </div>
    </section>
        
    <section id="poc">
      <div class="bg-gray-800 text-white py-4">
        <div class="container mx-auto flex justify-between items-center px-4">
          <h1 class="text-2xl font-bold">
            Proof of Concept
          </h1>
          <div>
            <select
              id="component-select"
              v-model="selectedComponent"
              class="bg-gray-700 text-white p-2 rounded"
            >
              <option value="Bank USA">
                Bank USA
              </option>
              <option value="Bank EU">
                Bank EU
              </option>
              <option value="Finstream">
                Finstream Panel
              </option>
            </select>
          </div>
        </div>
      </div>
      <div class="bg-gray-300 h-[60vh] grid place-items-center">
        <div class="w-full">
          <MockBank 
            v-if="selectedComponent !== 'Finstream'" 
            :selected-bank="selectedComponent" 
          />
          <FinstreamPanel v-else />
        </div>
      </div>
    </section>
        
    <section id="database">
      <div class="bg-gray-800 text-white py-4">
        <div class="container mx-auto flex justify-between items-center px-4">
          <h1 class="text-2xl font-bold">
            Database
          </h1>
          <div class="flex gap-x-3">
            <div>
              <select
                id="component-select"
                v-model="selectedDb"
                class="bg-gray-700 text-white p-2 rounded"
              >
                <option 
                  value="gateway"
                  @click="setDefaults('gateway')"
                >
                  Gateway
                </option>
                <option 
                  value="banks"
                  @click="setDefaults('banks')"
                >
                  Banks
                </option>
              </select>
            </div>
            <div id="component-select">
              <select 
                v-if="selectedDb.localeCompare('gateway')" 
                v-model="selectedTable"
                class="bg-gray-700 text-white p-2 rounded"
              >
                <option 
                  v-for="table in bankOptions"
                  :value="table"
                >
                  {{ table }}
                </option>
              </select>
              <select 
                v-else
                v-model="selectedTable"
                class="bg-gray-700 text-white p-2 rounded"
              >
                <option 
                  v-for="table in gatewayOptions"
                  :value="table"
                >
                  {{ table }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div class="bg-gray-300 h-[60vh] grid place-items-center">
        <div class="w-full">
          <DisplayData
            :db="selectedDb"
            :table="selectedTable"
          />
        </div>
      </div>
    </section>

    <footer class="bg-gray-800 text-white py-8">
      <div class="container mx-auto px-4 text-center">
        <p class="mb-2">
          &copy; 2024 Finstream Network. Made with coffee.
        </p>
        <div class="flex flex-col justify-center">
          <div class="flex justify-center gap-x-2">
            <NuxtLink
              to="https://github.com/rajosch"
              target="_blank"
            >
              <img
                src="/img/logo/github.svg"
                class="border rounded-full h-8 w-8 p-1 hover:opacity-100 opacity-70"
              >
            </NuxtLink>
            <NuxtLink
              to="https://linkedin.com/in/raphaeljschmid"
              target="_blank"
            >
              <img
                src="/img/logo/linkedin.svg"
                class="border rounded-full h-8 w-8 p-1 hover:opacity-100 opacity-70"
              >
            </NuxtLink>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
  export default {
    data() {
      return {
        selectedComponent: 'Bank USA',
        selectedTable: 'messages',
        selectedDb: 'gateway',
        bankOptions: [
          'customers',
          'transactions'
        ],
        gatewayOptions: [
          'messages',
          'entities',
          'messageEntities',
          'contracts'
        ]
      };
    },
    methods: {
      setDefaults(db) {
        if(db.localeCompare('gateway') === 0) {
          this.selectedTable = 'messages';
        }else {
          this.selectedTable = 'customers';
        }
      }
    }
  };
</script>
