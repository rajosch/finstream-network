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
      class="p-10 lg:px-56 h-90 flex flex-col justify-center"
    >
      <h2 class="text-2xl md:text-4xl font-bold mb-4 text-center">
        What is Finstream Network?
      </h2>
      <p class="text-lg md:text-xl mb-8 text-center">
        Finstream is a PoC to showcase a seamless cross-border payments using blockchain technology.
        It provides a secure, efficient, and transparent way to transfer money internationally.
      </p>
      <div id="message-verification">
        <h2 class="text-xl font-semibold mb-5">
          How the message verification works 
        </h2>
        <div class="mb-4 grid gap-y-2">
          <p>
            In the <b>Message Storage & Verification</b> section you can add and verify example messages.
          </p>
          <ol class="list-decimal pl-6">
            <li>
              <b>message</b> is a message according to the ISO20022 standard.
            </li>
            <li>
              <b>binData</b> is the same message stored in binary.
            </li>
            <li>
              <b>messageHash</b> is the keccak256 hash of the binary data.
            </li>
            <li>
              <b>ticketId</b> is the ID the ticket associated with these messages would have on the blockchain.
            </li>
            <li>
              <b>parent</b> refers to the message that is the immediate predecessor of the message.
            </li>
            <li>
              <b>status</b> shows if the validity of the message has been verified. There are three possible states:
              <ul class="pl-2 list-disc">
                <li><i>unverified</i></li>
                <li><i>verified</i></li>
                <li><i>corrupted</i></li>
              </ul>
            </li>
            <li>
              The <span class="text-green-500">verify</span> button checks each of the messages individually against the <i>current selected root</i>.
            </li>
          </ol>
          <p>
            The initial status of each message is <i>unverified</i>.
          </p>
          <img
            src="/img/explanation/1.png"
            class=""
          > 
        </div>
        <div class="mb-4 grid gap-y-2">
          <p>
            Clicking the  <span class="text-green-500">verify</span> button changes the status of the message to <i>verified</i> if it is valid.
          </p>
          <p>
            The validity gets checked by building the Merkle tree locally with all message hashes and creating a proof with the selected hash. This proof then gets verified against root which is stored on-chain.
          </p>
          <img
            src="/img/explanation/2.png"
            class=""
          > 
        </div>
        <div class="mb-4 grid gap-y-2">
          <p>
            Adding a new message the Merkle tree gets re-calculated and a new root saved on-chain. 
          </p>
          <img
            src="/img/explanation/3.png"
            class=""
          > 
        </div>
        <div class="mb-4 grid gap-y-2">
          <p>
            Everytime a root for a ticket is updated it also gets logged.
            This enables a potential auditor to traverse the messages and verify them against each individual root.
          </p>
          <p>
            In the example shown below the first root is selected, after both messages have been successfully verified against the current on-chain root.
          </p>
          <img
            src="/img/explanation/4.png"
            class=""
          > 
        </div>
        <div class="mb-4 grid gap-y-2">
          <p>
            Checking both messages against the selected historical root shows that the first message remains valid while the new message cannot be verified against it.
          </p>
          <img
            src="/img/explanation/5.png"
            class=""
          > 
        </div>
        <div class="mb-4 grid gap-y-2">
          <p>
            Here we are adding a third message and successfully verifying the messages against the new root.
          </p>
          <img
            src="/img/explanation/6.png"
            class=""
          > 
        </div>
        <div class="mb-4 grid gap-y-2">
          <p>
            Now we open the message and tamper with it, changing the time of the message creation from 12:38...
          </p>
          <img
            src="/img/explanation/7.png"
            class=""
          > 
        </div>
        <div class="mb-4 grid gap-y-2">
          <p>
            ...to 12:45, updating the stored binary and message hash in the process. 
          </p>
          <p>
            Only the binary gets stored in the actual PoC. 
            The message hash then gets calculated from the binary. 
            tampering with the data always includes a change in the message hash.
          </p>
          <p>
            In the PoC we assume that a malicious actor cannot update the on-chain root with falsified data. 
            This is not enforced in the current implementation but could be done by building the tree itself on-chain instead of just passing the new root.
          </p>
          <p>
            To prevent a malicious actor from falsifying data from the start there would have to be additional checks.
            This method only serves to protect against after-the-fact data tampering.
          </p>
          <img
            src="/img/explanation/8.png"
            class=""
          > 
        </div>
        <div class="mb-4 grid gap-y-2">
          <p>
            Trying to verify the messages against the on-chain root all of the messages return <i>corrupted</i>, 
            signaling that one or more of the messages have been tampered with.
          </p>
          <img
            src="/img/explanation/9.png"
            class=""
          > 
        </div>
        <div class="mb-4 grid gap-y-2">
          <p>
            Now we can select older roots to try and find out which messages are still valid.
          </p>
          <img
            src="/img/explanation/10.png"
            class=""
          > 
        </div>
        <div class="mb-4 grid gap-y-2">
          <p>
            The last root returns verifies all of the older messages which means that the last message has been corrupted. 
          </p>
          <img
            src="/img/explanation/11.png"
            class=""
          > 
        </div>
        <div class="mb-8">
          <h2 class="text-lg font-semibold my-4">
            Potential Problems
          </h2>
          <ul class="list-disc pl-5">
            <li><b>Problems:</b>
              <ul class="list-disc pl-4">
                <li>Scalability concerns due to transaction costs and time as the blockchain grows.</li>
                <li>Dependence on accurate initial data entry, as errors are permanently recorded due to blockchain's immutability.</li>
                <li>Tempering with multiple data entries could be used to mask actual data tampering, complicating detection and correction.</li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
      <div  id="transaction-example">
        <h2 class="text-xl font-semibold mb-5">
          Example Transaction POC
        </h2>
        <div class="mb-4 grid gap-y-2">
          <p>
            In the <b>Proof of Concept</b> section a cross-border transaction utilizing the Finstream Network can be simulated.
          </p>
          <p>
            This simulation includes multiple parts:
          </p>
          <ul class="list-disc pl-5">
            <li><b>Gateway server</b> responsible for storing and verifying messages and facilitating blockchain interactions.</li>
            <li>
              <b>Mockup Banks</b>:
              <ul class="list-disc pl-4">
                <li>Bank USA</li>
                <li>Bank EU</li>
              </ul>
            </li>
            <li>
              <b>Local Node of the Sepolia test network</b> with deployed contracts:
              <ul class="list-disc pl-4">
                <li>Controller</li>
                <li>MsgTicket</li>
                <li>Treasury</li>
              </ul>
            </li>
          </ul>
          <p>
            The example below will showcase a x-border bank transfer from the USA ($) to Europe (€).
          </p>
          <p>
            1. Log in as Alice in the mockup bank in the USA.
          </p>
          <img
            src="/img/example/1.png"
            class=""
          > 
        </div>
        <div class="mb-4 grid gap-y-2">
          <p>
            2. Select the amount to transfer and choose a recipient (here Bob).
          </p>
          <img
            src="/img/example/2.png"
            class=""
          > 
        </div>
        <div class="mb-4 grid gap-y-2">
          <p>
            3. Alice can now follow the transaction in real-time as it goes through multiple steps.
          </p>
          <ul class="list-decimal pl-8">
            <li>The bank handles the transaction in their own system, charging the account of the sender.</li>
            <li>Alice can now see that the transaction has been started.</li>
            <li>Bank USA acting as the debotr agent for Alice mints a ticket with the Controller contract where it is listed as a client of the Finstream Network.</li>
            <li>The first ISO20022 message is send to the Finstream gateway, where its validity is checked and then it is converted to binary in stored.</li>
            <li>A merkle tree is create from the singular message hash and the root gets updated on chain.</li>
            <li>Alice can now see that the transaction has been forwarded.</li>
            <li>The Finstream Gateway now checks the current exchange rate on-chain.</li>
            <li>The Finstream Gateway sends an ISO20022 compliant message with the proposed exchange rate to Bank USA.</li>
            <li>The new message gets saved in binary and the root on chain gets updated.</li>
            <li>Alice can now see that the exchange rate has been set.</li>
            <li>Accepting the exchange rate, Bank USA sends another message initiating the transaction.</li>
            <li>The new message gets saved in binary and the root on chain gets updated.</li>
            <li>The Finstream Gateway sends a message to Bank EU.</li>
            <li>The new message gets saved in binary and the root on chain gets updated.</li>
            <li>Alice can now see that the funds are being transfered.</li>
            <li>The funds are transfered on-chain using USDC and EURC stablecoins.</li>
            <li>Bank EU sends a message confirming the reception of funds.</li>
            <li>Bank EU credits Bobs bank account.</li>
            <li>The new message gets saved in binary and the root on chain gets updated.</li>
            <li>Alice can now see that the transaction has been completed successfully.</li>
            <li>Bob can now see that the transaction has been completed successfully.</li>
          </ul>
          <img
            src="/img/example/3.png"
            class=""
          > 
        </div>
        <div class="mb-4 grid gap-y-2">
          <p>
            4. The transfer is now complete.
          </p>
          <img
            src="/img/example/4.png"
            class=""
          > 
        </div>
        <div class="mb-4 grid gap-y-2">
          <p>
            5. Verifying Bob from the EU mockup bank recieved the appropriate amount in € according to the current $/€ exchange rate.
          </p>
          <img
            src="/img/example/5.png"
            class=""
          > 
        </div>
        <div class="mb-4 grid gap-y-2">
          <p>
            6. The messages are stored and updated in real time on the Finstream gateway.
          </p>
          <ol class="list-decimal pl-6">
            <li>
              <b>data</b> is a ISO20022 conform message in binary.
            </li>
            <li>
              <b>messageHash</b> is the keccak256 hash of the binary data.
            </li>
            <li>
              <b>ticketId</b> is the ID the ticket (NFT) associated with these messages on the blockchain (0 in our example).
            </li>
            <li>
              <b>parent</b> refers to the message that is the immediate predecessor of the message.
            </li>
            <li>
              <b>verifed</b> shows if the the message is valid. There are three possible states:
              <ul class="pl-2 list-disc">
                <li><i>unverified</i></li>
                <li><i>verified</i></li>
                <li><i>corrupted</i></li>
              </ul>
            </li>
          </ol>
          <img
            src="/img/example/6.png"
            class=""
          > 
        </div>
        <div class="mb-4 grid gap-y-2">
          <p>
            7. The Finstream Panel is hosted by the Gateway server for its clients (banks) to keep track of an verify transactions.
          </p>
          <p>
            The transactions are associated with a ticket (NFT) minted to the account of the issuing debtor agent (in this example the bank USA).
          </p>
          <p>
            Every account can see the messages associated with them. Even if they did not issue them.
          </p>
          <img
            src="/img/example/7.png"
            class=""
          > 
        </div>
        <div class="mb-4 grid gap-y-2">
          <p>
            8. The messages can be verified against the merkle root stored on chain as explained in the prior section.
          </p>
          <img
            src="/img/example/8.png"
            class=""
          > 
        </div>
        <div class="mb-4 grid gap-y-2">
          <p>
            9. And Bank EU can also see and verify it's associated messages.
          </p>
          <img
            src="/img/example/9.png"
            class=""
          > 
        </div>
        <div>
          <h2 class="text-lg font-semibold my-4">
            Additional Information
          </h2>
          <p>
            This example is highly simplified and just serves to demonstrate the base functionalities of utilizing blockchain technologies for x-border payments.
          </p>
          <p>
            As it stands now there are some caveats with the implementation of the Gateway and its smart contracts.
            <ul class="list-disc pl-6">
              <li>
                Only the debtor agent is capable of adding messages to a ticket. 
                This can be adjusted with e.g. a mapping authorizing other involved entities to add messages to a ticket.
              </li>
              <li>
                In the PoC there is no option to tamper with the data and the verification process itself in the Finstream Panel does not check agains the roots stored on-chain. 
                This is for simplification as the verification process is already explained in the previous section.
              </li>
              <li>
                The Treasury contract is highly simplified and just facilitates the transfer of the Mockup USDC and EURC stable coins with basically unlimited funds.
                A more sophisticated AMM could be integrated here for improved price discovery and to ensure liquidity.
              </li>
            </ul>
          </p>
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
