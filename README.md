# FinStream - Network

## TODO

### Frontend

* [X] Plan out transaction steps
* [ ] Set up the encryption to be bank/gateway bank/bank/gateway where appropriate
* [ ] Setup up transaction
  * [ ] Realize transfer without blockchain first
  * [ ] Add blockchain calls to transaction
* [ ] Set up state management & make database info global
* [ ] Add fuctions to update database info
* [ ] Add `sent and recieved transactions (including status)` for customer interface
* [ ] Make `explanation video` and add it to the `About` section

### Blockchain

* [X] Spin up local node with Hardhat
* [ ] Implement `Chainlink Price Feed`for Ethereum EUR/USD | USD/EUR
* [ ] Make sure EURC and USDC mock coins are deployed to local node and function
* [ ] Adjust treasury

  * [ ] For PoC there is always enough liquidity in the pool, the banks don't send anything themselves (they get credit/debt)
  * [ ] There is a `debt` but they will never reach the end of it
  * [ ] add getExchagenRate call
  * [ ] add transferFunds

### Backend / Gateway

* [X] Add IBAN to customer table
* [X] Add extra table with `sender`, `receiver` and `status`
* [ ] Add logic to query messages connected to messageId (one transaction)
* [X] Create Message route should return the ticket ID or an error message
* [ ] handle merkle tree creation on server side
* [X] Make sure the XSD content is handled on the server side

## Future Work

TODO
