const { ethers } = require('ethers')
const { validateXML, xmlToBin } = require('../../../xml-processor/src/index');
const xmlbuilder = require('xmlbuilder');

async function createMessage(messageType, messageArgs, ticketId, xsdContent, root, parent) {
  let message = null;

  if (messageType.localeCompare('pain.001.001.12') === 0) {
    message = createPain00100112(messageArgs);
  } else if (messageType.localeCompare('fxtr.014.001.05') === 0) {
    message = createFxtr01400105(messageArgs);
  } else if (messageType.localeCompare('pacs.002.001.14') === 0) {
    message = createPacs00200114(messageArgs);
  }

  if (message) {
    if (validateXML(message, xsdContent)) {
      // Parse XML to binary
      const buffer = await xmlToBin(message, root, 'Document');

      const messageHash = ethers.keccak256(buffer);
      
      // Encrypt message
      // return encryptFile(buffer, wallets, parent, ticketId);
      return {
        data: buffer,
        parent: parent,
        messageHash: messageHash,
        ticketId: ticketId
      }
    }
  }

  return null;
}

function orderMessages(messages) {
  // Ensure there is exactly one root message (parent is null)
  const rootMessages = messages.filter(message => message.parent === null);
  if (rootMessages.length !== 1) {
    throw new Error('There should be exactly one root message');
  }

  // Create a map to easily find messages by their id
  const messageMap = {};
  messages.forEach(message => {
    messageMap[message.id] = message;
  });

  // Initialize the ordered messages with the root message
  const orderedMessages = [];
  const queue = [rootMessages[0]];

  // Use a queue to perform a breadth-first search
  while (queue.length > 0) {
    const currentMessage = queue.shift();
    orderedMessages.push(currentMessage);

    // Find all children of the current message, ensuring the comparison is done properly
    const children = messages.filter(message => Number(message.parent) === currentMessage.id);
    queue.push(...children);
  }

  return orderedMessages;
}

function createPain00100112({
  msgId,
  creDtTm,
  nbOfTxs,
  ctrlSum,
  initgPtyNm,
  pmtInfId,
  pmtMtd,
  pmtTpInfSvcLvlCd,
  reqdExctnDt,
  dbtrNm,
  dbtrAcctIBAN,
  dbtrAgtBICFI,
  endToEndId,
  instdAmtCcy,
  instdAmt,
  cdtrAgtBICFI,
  cdtrAcctIBAN
}) {
  const xml = xmlbuilder.create('Document', { encoding: 'UTF-8' })
    .att('xmlns', 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.12')
    .ele('CstmrCdtTrfInitn')
      .ele('GrpHdr')
        .ele('MsgId', msgId).up()
        .ele('CreDtTm', creDtTm).up()
        .ele('NbOfTxs', nbOfTxs).up()
        .ele('CtrlSum', ctrlSum).up()
        .ele('InitgPty')
          .ele('Nm', initgPtyNm).up()
        .up()
      .up()
      .ele('PmtInf')
        .ele('PmtInfId', pmtInfId).up()
        .ele('PmtMtd', pmtMtd).up()
        .ele('NbOfTxs', nbOfTxs).up()
        .ele('CtrlSum', ctrlSum).up()
        .ele('PmtTpInf')
          .ele('SvcLvl')
            .ele('Cd', pmtTpInfSvcLvlCd).up()
          .up()
        .up()
        .ele('ReqdExctnDt')
            .ele('DtTm', reqdExctnDt).up()
        .up()
        .ele('Dbtr')
          .ele('Nm', dbtrNm).up()
        .up()
        .ele('DbtrAcct')
          .ele('Id')
            .ele('IBAN', dbtrAcctIBAN).up()
          .up()
        .up()
        .ele('DbtrAgt')
          .ele('FinInstnId')
            .ele('BICFI', dbtrAgtBICFI).up()
          .up()
        .up()
        .ele('CdtTrfTxInf')
          .ele('PmtId')
            .ele('EndToEndId', endToEndId).up()
          .up()
          .ele('Amt')
            .ele('InstdAmt', { Ccy: instdAmtCcy }, instdAmt).up()
          .up()
          .ele('CdtrAgt')
            .ele('FinInstnId')
              .ele('BICFI', cdtrAgtBICFI).up()
            .up()
          .up()
          .ele('CdtrAcct')
            .ele('Id')
              .ele('IBAN', cdtrAcctIBAN).up()
            .up()
          .up()
        .up()
      .up()
    .up()
    .end({ pretty: true });

  return xml;
}

function createFxtr01400105({
  tradDt,
  orgtrRef,
  tradgSdIdAnyBIC,
  ctrPtySdIdAnyBIC,
  tradgSdBuyAmtIdr,
  tradgSdBuyAmtUnit,
  tradgSdSellAmtIdr,
  tradgSdSellAmtUnit,
  sttlmDt,
  xchgRate
}) {
  const xml = xmlbuilder.create('Document', { encoding: 'UTF-8' })
    .att('xmlns', 'urn:iso:std:iso:20022:tech:xsd:fxtr.014.001.05')
    .ele('FXTradInstr')
      .ele('TradInf')
        .ele('TradDt', tradDt).up()
        .ele('OrgtrRef', orgtrRef).up()
      .up()
      .ele('TradgSdId')
        .ele('SubmitgPty')
          .ele('AnyBIC')
            .ele('AnyBIC', tradgSdIdAnyBIC).up()
          .up()
        .up()
      .up()
      .ele('CtrPtySdId')
        .ele('SubmitgPty')
          .ele('AnyBIC')
            .ele('AnyBIC', ctrPtySdIdAnyBIC).up()
          .up()
        .up()
      .up()
      .ele('TradAmts')
        .ele('TradgSdBuyAmt')
          .ele('DgtlTknAmt')
            .ele('Idr', tradgSdBuyAmtIdr).up()
            .ele('Unit', tradgSdBuyAmtUnit).up()
          .up()
        .up()
        .ele('TradgSdSellAmt')
          .ele('DgtlTknAmt')
            .ele('Idr', tradgSdSellAmtIdr).up()
            .ele('Unit', tradgSdSellAmtUnit).up()
          .up()
        .up()
        .ele('SttlmDt', sttlmDt).up()
      .up()
      .ele('AgrdRate')
        .ele('XchgRate', xchgRate).up()
      .up()
    .up()
    .end({ pretty: true });

  return xml;
}

function createPacs00200114({
  msgId,
  creDtTm,
  orgnlMsgId,
  orgnlMsgNmId,
  orgnlEndToEndId,
  txSts
}) {
  const xml = xmlbuilder.create('Document', { encoding: 'UTF-8' })
    .att('xmlns', 'urn:iso:std:iso:20022:tech:xsd:pacs.002.001.14')
    .ele('FIToFIPmtStsRpt')
      .ele('GrpHdr')
        .ele('MsgId', msgId).up()
        .ele('CreDtTm', creDtTm).up()
      .up()
      .ele('OrgnlGrpInfAndSts')
        .ele('OrgnlMsgId', orgnlMsgId).up()
        .ele('OrgnlMsgNmId', orgnlMsgNmId).up()
      .up()
      .ele('TxInfAndSts')
        .ele('OrgnlEndToEndId', orgnlEndToEndId).up()
        .ele('TxSts', txSts).up()
      .up()
    .up()
    .end({ pretty: true });

  return xml;
}

module.exports = {
  createMessage,
  orderMessages,
  createPain00100112,
  createFxtr01400105,
  createPacs00200114
};
