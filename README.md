# FinStream - Network

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
  - [ ] local storage
    - [ ] Bank Objects (Bank USA & Bank EUR)
      - [X] Customer Objects
        - [X] ID
        - [X] Name
        - [X] Money in bank account
      - [ ] Transactions (array of objects)
        - [X] ID
        - [X] Amount
        - [ ] Messages (array of objects)
          - [ ] encrypted data
          - [ ] symmetric key (array of objects)
            - [ ] encrypted key
            - [ ] iv
            - [ ] salt
            - [ ] publicKey
          - [ ] iv
          - [ ] messageHash
          - [ ] ticketId
          - [ ] parent
        - [ ] Status
  - [X] Create local storage when starting the page
  - [ ] Update local storage when appropriate
- [ ] Smart Contracts

  - [X] architecture
  - [X] adjust `MsgTicket` smart contract to handle merkle-trees correctly
  - [X] improve smart contract access rights `Role-Based Access Control (RBAC)`
  - [X] mock-up USDC & EURC contracts
  - [X] improve `Treasury`smart contract

    - [X] Implement the **Chainlink Price Feed** for up to date price conversion
  - [ ] testing

    - [ ] hardhat tests
  - [ ] integrate into frontend
  - [ ] Since there is no EUR/USD price feed on the Fuji Testnet LINK/AVAX will acts as a price feed place holder for them
  - [ ] to simplify things both bank usa and bank europe have a considerable amount of liquidity they can use
  - [ ] Deploy to Fuji Testnet
- [ ] Gateway

  - [X] message creation
  - [X] message parsing
  - [X] message encrpytion
  - [ ] create merke tree / update merkle tree
  - [ ] mint ticket / update merkle tree
  - [ ] return (updated) merkle tree
  - [ ] read data
- [ ] Frontend

  - [ ] UPDATE VIDEO ID!!!
  - [ ] add information to about section (capabilities, reason, etc?)
  - [ ] add links to blockexplorer for contracts
  - [ ] add wallets [bank-eu, bank-usa] (private keys 'oh schreck')
  - [ ] add contract calls (ethers)
  - [ ] database write & read information

### Future Work

- [ ] Avalanche Subnet Architecture
- [ ] Connect Chainlink APIs with Subnet
- [ ] general .xsd to .proto parser
- [ ] IPFS
- [ ] Chainlink Automation
