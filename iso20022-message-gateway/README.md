# ISO20022 Message Gateway
https://www.iso20022.org/about-iso-20022


## Prerequisites

Before you begin, ensure you have met the following requirements:

### System Dependencies

- **xmllint**: This project uses `xmllint` for XML validation against XSD schemas. It is part of the `libxml2` toolkit. You must install this on your system to ensure XML validation functions correctly within the project. Here's how you can install it on various operating systems:

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install libxml2-utils
```

#### CentOS/RHEL
```bash
sudo yum install libxml2
```

#### macOS
```bash
brew install libxml2
```

Windows

For Windows users, xmllint can be installed via:

- Cygwin: Include libxml2 during the Cygwin installation.
- Windows Subsystem for Linux (WSL): If you are using WSL, install libxml2-utils as you would in a Linux environment.

## ISO20022 Message Types

As taken from the [ISO20022 message definitions](https://www.iso20022.org/iso-20022-message-definitions).
Note that this only provides the information relevant for the scope of the hackathon.

### Assumptions

- The `Digital Token Identifier (DTI)` for EURC is **R7H2JDXF3** and for USDC is **U8D4N2XJF**

### pain.001.001.12 - Customer Credit Transfer Initiation v12
#### Definition
The CustomerCreditTransferInitiation message is sent by the initiating party to the forwarding agent or debtor agent. 
It is used to request movement of funds from the debtor account to a creditor. 

### pacs.002.001.14 - Payment Status Report v14
#### Definition
The CustomerPaymentStatusReport message is sent by an instructed agent to the previous party in the payment chain. 
It is used to inform this party about the positive or negative status of an instruction (either single or file). It is also used to report on a pending instruction.

### fxtr.002.001.04 - Foreign Exchange Instruction
#### Definition
The Foreign Exchange Instruction message is sent by a market participant to a counterparty or their designated agent. It is used to provide details about a proposed foreign exchange transaction, specifying the currency pair, amounts, and the desired execution terms. This message type is typically used in negotiations prior to finalizing a foreign exchange deal, serving as an instruction to execute the trade under the terms outlined.

### fxtr.001.001.04 - Foreign Exchange Confirmation
#### Definition
The Foreign Exchange Confirmation message is sent by a market participant to a counterparty or their designated agent. This message formally confirms the details of a completed foreign exchange transaction. It includes information such as the transaction date, settlement details, traded currencies, and rates. It serves as a binding confirmation of the trade, providing both parties with a record of the agreed terms for reconciliation and legal purposes.

