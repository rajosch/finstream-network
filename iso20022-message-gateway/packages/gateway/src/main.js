const { create } = require('xmlbuilder2');
const { validateXML } = require('../../xml-processor/src/index');


function createPain00100112({
  msgId,
  creDtTm,
  nbOfTxs,
  ctrlSum,
  initgPtyNm,
  pmtInfId,
  pmtMtd,
  reqdExctnDt,
  dbtrNm,
  dbtrIban,
  dbtrBic,
  endToEndId,
  instdAmt,
  instdAmtCcy,
  cdtrBic,
  cdtrIban
}) {
  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('Document', { xmlns: 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.12' })
      .ele('CstmrCdtTrfInitn')
        .ele('GrpHdr')
          .ele('MsgId').txt(msgId).up()
          .ele('CreDtTm').txt(creDtTm).up()
          .ele('NbOfTxs').txt(nbOfTxs).up()
          .ele('CtrlSum').txt(ctrlSum).up()
          .ele('InitgPty')
            .ele('Nm').txt(initgPtyNm).up()
          .up()
        .up()
        .ele('PmtInf')
          .ele('PmtInfId').txt(pmtInfId).up()
          .ele('PmtMtd').txt(pmtMtd).up()
          .ele('NbOfTxs').txt(nbOfTxs).up()
          .ele('CtrlSum').txt(ctrlSum).up()
          .ele('PmtTpInf')
            .ele('SvcLvl')
              .ele('Cd').txt('NORM').up()
            .up()
          .up()
          .ele('ReqdExctnDt').txt(reqdExctnDt).up()
          .ele('Dbtr')
            .ele('Nm').txt(dbtrNm).up()
          .up()
          .ele('DbtrAcct')
            .ele('Id')
              .ele('IBAN').txt(dbtrIban).up()
            .up()
          .up()
          .ele('DbtrAgt')
            .ele('FinInstnId')
              .ele('BICFI').txt(dbtrBic).up()
            .up()
          .up()
          .ele('CdtTrfTxInf')
            .ele('PmtId')
              .ele('EndToEndId').txt(endToEndId).up()
            .up()
            .ele('Amt', { Ccy: instdAmtCcy }).txt(instdAmt).up()
            .ele('CdtrAgt')
              .ele('FinInstnId')
                .ele('BICFI').txt(cdtrBic).up()
              .up()
            .up()
            .ele('CdtrAcct')
              .ele('Id')
                .ele('IBAN').txt(cdtrIban).up()
              .up()
            .up()
          .up()
        .up()
      .up()
    .end({ prettyPrint: true });

  return doc;
}

function createFxtr01400105({
  tradDt,
  orgtrRef,
  tradgSdBIC,
  ctrPtySdBIC,
  buyAmtIdr,
  buyAmtUnit,
  sellAmtIdr,
  sellAmtUnit,
  sttlmDt,
  xchgRate
}) {
  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('Document', { xmlns: 'urn:iso:std:iso:20022:tech:xsd:fxtr.014.001.05' })
      .ele('FXTradInstr')
        .ele('TradInf')
          .ele('TradDt').txt(tradDt).up()
          .ele('OrgtrRef').txt(orgtrRef).up()
        .up()
        .ele('TradgSdId')
          .ele('SubmitgPty')
            .ele('AnyBIC')
              .ele('AnyBIC').txt(tradgSdBIC).up()
            .up()
          .up()
        .up()
        .ele('CtrPtySdId')
          .ele('SubmitgPty')
            .ele('AnyBIC')
              .ele('AnyBIC').txt(ctrPtySdBIC).up()
            .up()
          .up()
        .up()
        .ele('TradAmts')
          .ele('TradgSdBuyAmt')
            .ele('DgtlTknAmt')
              .ele('Idr').txt(buyAmtIdr).up()
              .ele('Unit').txt(buyAmtUnit).up()
            .up()
          .up()
          .ele('TradgSdSellAmt')
            .ele('DgtlTknAmt')
              .ele('Idr').txt(sellAmtIdr).up()
              .ele('Unit').txt(sellAmtUnit).up()
            .up()
          .up()
          .ele('SttlmDt').txt(sttlmDt).up()
        .up()
        .ele('AgrdRate')
          .ele('XchgRate').txt(xchgRate).up()
        .up()
      .up()
    .end({ prettyPrint: true });

  return doc;
}

function createPacs00200114({
  msgId,
  creDtTm,
  orgnlMsgId,
  orgnlMsgNmId,
  orgnlEndToEndId,
  txSts
}) {
  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('Document', { xmlns: 'urn:iso:std:iso:20022:tech:xsd:pacs.002.001.14' })
      .ele('FIToFIPmtStsRpt')
        .ele('GrpHdr')
          .ele('MsgId').txt(msgId).up()
          .ele('CreDtTm').txt(creDtTm).up()
        .up()
        .ele('OrgnlGrpInfAndSts')
          .ele('OrgnlMsgId').txt(orgnlMsgId).up()
          .ele('OrgnlMsgNmId').txt(orgnlMsgNmId).up()
        .up()
        .ele('TxInfAndSts')
          .ele('OrgnlEndToEndId').txt(orgnlEndToEndId).up()
          .ele('TxSts').txt(txSts).up()
        .up()
      .up()
    .end({ prettyPrint: true });

  return doc;
}

function initiateTransaction(arr) {
    const xml = createPain00100112(...arr);
    if(validateXML()){
        
    }
}

module.exports = {
    initiateTransaction
};
