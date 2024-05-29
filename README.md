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
  - [ ] improve smart contract access rights `Role-Based Access Control (RBAC)`
  - [ ] Chainlink Functions - call DEX for optimal conversion rate
  - [ ] mock-up USDC & EURC contracts
  - [ ] improve `Treasury`smart contract
  - [ ] testing
- [ ] Chainlink Automation - Automatic TX calls (?)
- [ ] Bank Frontend
- [ ] Gateway Frontend

### Future Work

- [ ] Avalanche Subnet Architecture
- [ ] Connect Chainlink APIs with Subnet
- [ ] general .xsd to .proto parser
