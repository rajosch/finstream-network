# FinStream - Network

## TODO

### Frontend

* [X] Plan out transaction steps
* [ ] Setup up transaction
  * [X] Realize transfer without blockchain first
  * [X] create messages on transfer with stand-in blockchain data (continue creating the messages; setup the wallets again; need them for blockchain interaction)
  * [ ] Add blockchain calls to transaction
* [X] Set up state management & make database info global
* [X] Add functions to update database info
* [X] Add `sent and recieved transactions (including status)` for customer interface
* [X] fix selectedTransaction bug in the mock-bank component
* [ ] Put explanations in the about section (from readme info TBD)
* [ ] Make `explanation video` and add it to the `About` section
* [ ] Explain that encryption is taken out for PoC but would be possible (multi-party-encryption)

### Blockchain

* [X] Spin up local node with Hardhat
* [X] Implement `Chainlink Price Feed`for Ethereum EUR/USD
* [X] Make sure EURC and USDC mock coins are deployed to local node and function
* [X] Adjust treasury

  * [X] For PoC the banks have a lot of liquidity
  * [X] add getExchagenRate call
  * [X] add transferFunds

### Backend / Gateway

* [X] Add IBAN to customer table
* [X] Add extra table with `sender`, `receiver` and `status`
* [X] Add logic to query messages connected to messageId (one transaction)
* [X] Create Message route should return the ticket ID or an error message
* [X] handle merkle tree creation on server side
* [X] handle merkle tree validation on server side
* [X] Make sure the XSD content is handled on the server side
* [X] split up gateway and bank databases for clearer structure
* [ ] Check against on-chain root to verify messages

## Future Work

TODO
