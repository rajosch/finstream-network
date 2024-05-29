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
  - [ ] Merkle tree validator (off-chain)
  - [ ] IPFS
- [ ] Smart Contracts

  - [X] architecture
  - [ ] improve smart contract access rights `Role-Based Access Control (RBAC)`
  - [ ] Chainlink Functions - call DEX for optimal conversion rate
  - [ ] mock-up USDC & EURC contracts
  - [ ] testing
- [ ] Chainlink Automation - Automatic TX calls (?)
- [ ] Bank Frontend
- [ ] Bank Backend

### Future Work

- [ ] Avalanche Subnet Architecture
- [ ] Connect Chainlink APIs with Subnet
- [ ] general .xsd to .proto parser
