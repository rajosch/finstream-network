# FinStream - Network

## TODO

### Frontend

* [X] Plan out transaction steps
* [ ] Set up the encryption to be bank/gateway bank/bank/gateway where appropriate
* [ ] Setup up transaction
  * [X] Realize transfer without blockchain first
  * [ ] Add blockchain calls to transaction
* [X] Set up state management & make database info global
* [X] Add functions to update database info
* [X] Add `sent and recieved transactions (including status)` for customer interface
* [X] fix selectedTransaction bug in the mock-bank component
* [ ] Check against on-chain root to verify messages on the finstream-panel
* [ ] Put explanations in the about section (from readme info TBD)
* [ ] Make `explanation video` and add it to the `About` section

### Blockchain

* [X] Spin up local node with Hardhat
* [ ] Implement `Chainlink Price Feed`for Ethereum EUR/USD
* [ ] Make sure EURC and USDC mock coins are deployed to local node and function
* [ ] Adjust treasury

  * [ ] For PoC there is always enough liquidity in the pool, the banks don't send anything themselves (they get credit/debt)
  * [ ] There is a `debt` but they will never reach the end of it
  * [ ] add getExchagenRate call
  * [ ] add transferFunds

### Backend / Gateway

* [X] Add IBAN to customer table
* [X] Add extra table with `sender`, `receiver` and `status`
* [X] Add logic to query messages connected to messageId (one transaction)
* [X] Create Message route should return the ticket ID or an error message
* [ ] handle merkle tree creation on server side
* [ ] handle merkle tree validation on server side
* [X] Make sure the XSD content is handled on the server side
* [X] split up gateway and bank databases for clearer structure

## Future Work

TODO
