# FinStream - Blok Magic Hackathon

## Milestones

### First Iteration

- [X] XML to Protobuf parser

  - [X] validate ISO20022 XML message
  - [X] create all of the sample XML messages for the PoC
  - [X] hardcode .proto files for xml messages
  - [X] xmlToBin parser
  - [X] binToXml parser
- [ ] Message storage & validation

  - [X] multi part encrypter for binary ISO20022 messages
  - [X] Merkle tree validator (off-chain)
  - [ ] IPFS
- [ ] Smart Contracts

  - [X] architecture
  - [ ] adjust `MsgTicket` smart contract to handle merkle-trees correctly (openzeppelin)
  - [X] improve smart contract access rights `Role-Based Access Control (RBAC)`
  - [X] mock-up USDC & EURC contracts
  - [ ] improve `Treasury`smart contract
    - [ ] Implement the **Chainlink Price Feed** for up to date price conversion
  - [ ] Imporve Controller smart contract
    - [ ] Implement **Chainlink Automation** to automatically react to pre-defined conditions
  - [ ] testing
  - [ ] Since there is no EUR/USD price feed on the Fuji Testnet LINK/AVAX will acts as a price feed place holder for them
  - [ ] Deploy to Fuji Testnet
- [ ] Chainlink Automation - Automatic TX calls (?)
- [ ] Bank Frontend
- [ ] Gateway Frontend

### Future Work

- [ ] Avalanche Subnet Architecture
- [ ] Connect Chainlink APIs with Subnet
- [ ] general .xsd to .proto parser
