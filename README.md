# FinStream - Blok Magic Hackathon

## Milestones

- [X] XML to Protobuf parser

  - [X] validate ISO20022 XML message
  - [X] create all of the sample XML messages for the PoC
  - [X] hardcode .proto files for xml messages
  - [X] xmlToBin parser
  - [X] binToXml parser
- [ ] Message storage & validation

  - [X] multi part encrypter for binary ISO20022 messages
  - [X] Merkle tree validator (off-chain)
  - [ ] add database to save information
  - [ ] money in bank accounts
  - [ ] how much the banks owe the contract
  - [ ] transactions
  - [ ] message information, etc
- [ ] Smart Contracts

  - [X] architecture
  - [X] adjust `MsgTicket` smart contract to handle merkle-trees correctly
  - [X] improve smart contract access rights `Role-Based Access Control (RBAC)`
  - [X] mock-up USDC & EURC contracts
  - [X] improve `Treasury`smart contract

    - [X] Implement the **Chainlink Price Feed** for up to date price conversion
  - [ ] testing

    - [ ] setup a local node
    - [ ] run a test script
    - [ ] integrate into frontend
  - [ ] Since there is no EUR/USD price feed on the Fuji Testnet LINK/AVAX will acts as a price feed place holder for them
  - [ ] Deploy to Fuji Testnet
- [ ] Frontend

  - [ ] UPDATE VIDEO ID!!!
  - [ ] add information to about section (capabilities, reason, etc?)
  - [ ] add links to blockexplorer for contracts
  - [ ] add wallets [alice, bob, charly, diana, bank-eu, bank-usa] (private keys 'oh schreck')
  - [ ] add contract calls (ethers)
  - [ ] database write & read information
- [ ] deploy website to vercel

### Future Work

- [ ] Avalanche Subnet Architecture
- [ ] Connect Chainlink APIs with Subnet
- [ ] general .xsd to .proto parser
- [ ] IPFS
- [ ] Chainlink Automation
