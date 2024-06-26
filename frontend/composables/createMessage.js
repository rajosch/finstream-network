export function pain00100112(obj) {
    return {
      msgId: obj.GrpHdr.MsgId,
      creDtTm: obj.GrpHdr.CreDtTm,
      nbOfTxs: obj.GrpHdr.NbOfTxs,
      ctrlSum: obj.GrpHdr.CtrlSum,
      initgPtyNm: obj.GrpHdr.InitgPty.Nm,
      pmtInfId: obj.PmtInf.PmtInfId,
      pmtMtd: obj.PmtInf.PmtMtd,
      pmtTpInfSvcLvlCd: obj.PmtInf.PmtTpInf.SvcLvl.Cd,
      reqdExctnDt: obj.PmtInf.ReqdExctnDt.Dt,
      dbtrNm: obj.PmtInf.Dbtr.Nm,
      dbtrAcctIBAN: obj.PmtInf.DbtrAcct.Id.IBAN,
      dbtrAgtBICFI: obj.PmtInf.DbtrAgt.FinInstnId.BICFI,
      endToEndId: obj.PmtInf.CdtTrfTxInf.PmtId.EndToEndId,
      instdAmtCcy: obj.PmtInf.CdtTrfTxInf.Amt.InstdAmt['@Ccy'],
      instdAmt: obj.PmtInf.CdtTrfTxInf.Amt.InstdAmt['#text'],
      cdtrAgtBICFI: obj.PmtInf.CdtTrfTxInf.CdtrAgt.FinInstnId.BICFI,
      cdtrAcctIBAN: obj.PmtInf.CdtTrfTxInf.CdtrAcct.Id.IBAN
    };
}

export function  fxtr01400105(obj) {
    return {
      tradDt: obj.TradInf.TradDt, 
      orgtrRef: obj.TradInf.OrgtrRef,
      tradgSdIdAnyBIC: obj.TradgSdId.SubmitgPty.AnyBIC.AnyBIC,
      ctrPtySdIdAnyBIC: obj.TradgSdId.SubmitgPty.AnyBIC.AnyBIC,
      tradgSdBuyAmtIdr: obj.TradAmts.TradgSdBuyAmt.DgtlTknAmt.Idr,
      tradgSdBuyAmtUnit: obj.TradAmts.TradgSdBuyAmt.DgtlTknAmt.Unit,
      tradgSdSellAmtIdr: obj.TradAmts.TradgSdSellAmt.DgtlTknAmt.Idr,
      tradgSdSellAmtUnit: obj.TradAmts.TradgSdSellAmt.DgtlTknAmt.Unit,
      sttlmDt: obj.TradAmts.SttlmDt,
      xchgRate: obj.AgrdRate.XchgRate
    };
}

export function pacs00200114(obj) {
    return {
      msgId: obj.GrpHdr.MsgId,
      creDtTm: obj.GrpHdr.CreDtTm,
      orgnlMsgId: obj.OrgnlGrpInfAndSts.OrgnlMsgId,
      orgnlMsgNmId: obj.OrgnlGrpInfAndSts.OrgnlMsgNmId,
      orgnlEndToEndId: obj.TxInfAndSts.OrgnlEndToEndId,
      txSts: obj.TxInfAndSts.TxSts
    }
}