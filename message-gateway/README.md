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

### pain.001.001.12 - Customer Credit Transfer Initiation v12
#### Definition
The CustomerCreditTransferInitiation message is sent by the initiating party to the forwarding agent or debtor agent. 
It is used to request movement of funds from the debtor account to a creditor. 
#### Usage
Used to exchange:
- one or more instances of credit transfer initiation;
- payment transactions that result in electronic cash transfer to creditor account

The message can be used in a direct or a relay scenario:
- in direct scenario the message is sent directly to the debitor agent
- in a relay scenario it is sent to a forwarding agent, which acts as a concentrating financial institution

The message can also be used by an initiating party that has authority to send the message on behalf of the debtor.

Can be used in domestic and cross-border scenarios.

The CustomerCreditTransferInitiation message must not be used by the debtor agent to execute the credit transfer instruction(s). 
The FIToFICustomerCreditTransfer message must be used instead.

#### Outline
##### 3 Message Bulding Blocks
1. GroupHeader
a. Set of characteristics shared by all inidivdual transactions included in the message.
2. PaymentInformation
a. Set of characteristics that applies to the debit side of the payment transactins included in the credit transfer initiation.
3. SupplementaryData
a. Additional information that cannot be captured in the structured elements and/or any other specific block.


### pacs.002.001.14 - Payment Status Report v14
#### Definition
The CustomerPaymentStatusReport message is sent by an instructed agent to the previous party in the payment chain. 
It is used to inform this party about the positive or negative status of an instruction (either single or file). It is also used to report on a pending instruction.

### fxtr.002.001.04 - Foreign Exchange Instruction
### fxtr.001.001.04 - Foreign Exchange Confirmation


