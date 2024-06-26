<template>
  <div>
    <section
      id="messages"
      class=""
    >
      <div
        v-if="messages && messages.length"
        class="overflow-auto h-full"
      >
        <table class="min-w-full bg-white border border-gray-300">
          <thead class="sticky top-0 bg-gray-800 text-white">
            <tr>
              <th
                v-for="(value, key) in messages[0]"
                :key="key"
                class="py-2 px-4 border-b border-gray-200 whitespace-nowrap"
              >
                {{ key }}
              </th>
              <th />
            </tr>
          </thead>
          <tbody class="text-gray-500 cursor-default">
            <tr
              v-for="(item, index) in messages"
              :key="index"
            >
              <td
                v-for="(value, key) in item"
                :key="key"
                class="py-2 px-4 border-b border-gray-200 text-center max-w-xs truncate hover:bg-gray-200"
                :title="value"
                @click="showDetails(value, index)"
              >
                {{ truncatedValue(value) }}
              </td>
              <td
                class="py-2 px-4 border-b border-gray-200 text-center max-w-xs truncate"
              >
                <button
                  class="border border-gray-400 p-1 rounded-md text-green-400 hover:border-gray-600 hover:text-green-600"
                  @click.stop="console.log('start verification')"
                >
                  Verifiy
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else>
        <p>No data available.</p>
      </div>
    </section>
    <button 
      v-if="messages.length < 4"
      class="text-gray-700 bg-gray-100 w-full hover:shadow hover:font-semibold text-md"
      @click="addMessage(messages[messages.length-1].id)"
    >
      Add Message
    </button>
    <section class="text-gray-700 p-5">
      <div>
        Current Merkle tree root: <span class="font-semibold"> {{ root }}</span>
      </div>
    </section>
    <ModalView
      v-if="isModalOpen"
      @close="isModalOpen = false"
    >
      <MessageData v-if="typeof selectedValue === 'object'" :initial-json="selectedValue" @message-update="handleMessageUpdate" />
      <p v-else class="text-gray-500">{{ selectedValue }}</p>
    </ModalView>
  </div>
</template>

<script>
  import { ethers } from 'ethers';
  export default {
    data() {
      return {
        selectedValue: null,
        selectedMessage: null,
        isModalOpen: false,
        messages: [
          {
            id: 1,
            message: {
              "Document": {
                "@xmlns": "urn:iso:std:iso:20022:tech:xsd:pain.001.001.12",
                "CstmrCdtTrfInitn": {
                  "GrpHdr": {
                    "MsgId": "S-BU-001",
                    "CreDtTm": "2024-05-04T12:38:00",
                    "NbOfTxs": 1,
                    "CtrlSum": 1000.00,
                    "InitgPty": {
                      "Nm": "Alice"
                    }
                  },
                  "PmtInf": {
                    "PmtInfId": "X-BA-PAY001",
                    "PmtMtd": "TRF",
                    "NbOfTxs": 1,
                    "CtrlSum": 1000.00,
                    "PmtTpInf": {
                      "SvcLvl": {
                        "Cd": "NORM"
                      }
                    },
                    "ReqdExctnDt": {
                      "DtTm": "2024-05-04T14:00:00"
                    },
                    "Dbtr": {
                      "Nm": "Alice"
                    },
                    "DbtrAcct": {
                      "Id": {
                        "IBAN": "US33XXX1234567890123456789012"
                      }
                    },
                    "DbtrAgt": {
                      "FinInstnId": {
                        "BICFI": "BANKUS22"
                      }
                    },
                    "CdtTrfTxInf": {
                      "PmtId": {
                        "EndToEndId": "abc123"
                      },
                      "Amt": {
                        "InstdAmt": {
                          "@Ccy": "USD",
                          "#text": 1000.00
                        }
                      },
                      "CdtrAgt": {
                        "FinInstnId": {
                          "BICFI": "BANKEU11"
                        }
                      },
                      "CdtrAcct": {
                        "Id": {
                          "IBAN": "DE89370400440532013000"
                        }
                      }
                    }
                  }
                }
              }
            },
            binData: null,
            messageHash: null,
            ticketId: '0',
            parent: null,
            status: 'unverified'
          }
        ],
        root: 'root'
      }
    },
    async mounted() {
      const {binary, hash} = await getBinaryMessage(this.pain00100112Args(this.messages[0].message.Document.CstmrCdtTrfInitn), 'pain.001.001.12', 3000);
      this.messages[0].binData = binary;
      this.messages[0].messageHash = hash;
    },
    methods: {
      pain00100112Args(obj) {
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
      },
      fxtr01400105(obj) {
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
      },
      pacs00200114(obj) {
        return {
          msgId: obj.GrpHdr.MsgId,
          creDtTm: obj.GrpHdr.CreDtTm,
          orgnlMsgId: obj.OrgnlGrpInfAndSts.OrgnlMsgId,
          orgnlMsgNmId: obj.OrgnlGrpInfAndSts.OrgnlMsgNmId,
          orgnlEndToEndId: obj.TxInfAndSts.OrgnlEndToEndId,
          txSts: obj.TxInfAndSts.TxSts
        }
      },
      truncatedValue(value) {
        return value && value.length > 20 ? value.substring(0, 20) + '...' : value;
      },
      showDetails(value, index) {
        this.selectedValue = value;
        this.isModalOpen = true;
        this.selectedMessage = index;
      },
      async addMessage(id) {
        if(id === 1) {
          this.messages.push(
            {
              id: 2,
              message: {
                "Document": {
                  "@xmlns": "urn:iso:std:iso:20022:tech:xsd:fxtr.014.001.05",
                  "FXTradInstr": {
                    "TradInf": {
                      "TradDt": "2024-05-04",
                      "OrgtrRef": "abc123"
                    },
                    "TradgSdId": {
                      "SubmitgPty": {
                        "AnyBIC": {
                          "AnyBIC": "BANKUS22"
                        }
                      }
                    },
                    "CtrPtySdId": {
                      "SubmitgPty": {
                        "AnyBIC": {
                          "AnyBIC": "FNSTAC11"
                        }
                      }
                    },
                    "TradAmts": {
                      "TradgSdBuyAmt": {
                        "DgtlTknAmt": {
                          "Idr": "R7H2JDXF3",
                          "Unit": 900.00
                        }
                      },
                      "TradgSdSellAmt": {
                        "DgtlTknAmt": {
                          "Idr": "U8D4N2XJF",
                          "Unit": 1000.00
                        }
                      },
                      "SttlmDt": "2024-05-04"
                    },
                    "AgrdRate": {
                      "XchgRate": 0.9
                    }
                  }
                }
              },
              binData: null,
              messageHash: null,
              ticketId: '0',
              parent: 1,
              status: 'unverified'
            }
          )
          const {binary, hash} = await getBinaryMessage(this.fxtr01400105(this.messages[1].message.Document.FXTradInstr), 'fxtr.014.001.05', 3000);
          this.messages[1].binData = binary;
          this.messages[1].messageHash = hash;
        }else if(id === 2) {
          this.messages.push(
            {
              id: 3,
              message:  {
                "Document": {
                  "@xmlns": "urn:iso:std:iso:20022:tech:xsd:pain.001.001.12",
                  "CstmrCdtTrfInitn": {
                    "GrpHdr": {
                      "MsgId": "BU-FN-001",
                      "CreDtTm": "2024-05-04T12:38:00",
                      "NbOfTxs": 1,
                      "CtrlSum": 1000.00,
                      "InitgPty": {
                        "Nm": "Alice"
                      }
                    },
                    "PmtInf": {
                      "PmtInfId": "BU-FN-PAY001",
                      "PmtMtd": "TRF",
                      "NbOfTxs": 1,
                      "CtrlSum": 1000.00,
                      "PmtTpInf": {
                        "SvcLvl": {
                          "Cd": "NORM"
                        }
                      },
                      "ReqdExctnDt": {
                        "DtTm": "2024-05-04T14:00:00"
                      },
                      "Dbtr": {
                        "Nm": "Alice"
                      },
                      "DbtrAcct": {
                        "Id": {
                          "IBAN": "US33XXX1234567890123456789012"
                        }
                      },
                      "DbtrAgt": {
                        "FinInstnId": {
                          "BICFI": "BANKUS22"
                        }
                      },
                      "CdtTrfTxInf": {
                        "PmtId": {
                          "EndToEndId": "abc123"
                        },
                        "Amt": {
                          "InstdAmt": {
                            "@Ccy": "USD",
                            "#text": 1000.00
                          }
                        },
                        "CdtrAgt": {
                          "FinInstnId": {
                            "BICFI": "BANKEU11"
                          }
                        },
                        "CdtrAcct": {
                          "Id": {
                            "IBAN": "DE89370400440532013000"
                          }
                        }
                      }
                    }
                  }
                }
              },
              binData: null,
              messageHash: null,
              ticketId: '0',
              parent: 2,
              status: 'unverified'
            }
          )
          const {binary, hash} = await getBinaryMessage(this.pain00100112Args(this.messages[2].message.Document.CstmrCdtTrfInitn), 'pain.001.001.12', 3000);
          this.messages[2].binData = binary;
          this.messages[2].messageHash = hash;
        }else if (id === 3) {
          this.messages.push(
            {
              id: 4,
              message:  {
                "Document": {
                  "@xmlns": "urn:iso:std:iso:20022:tech:xsd:pacs.002.001.14",
                  "FIToFIPmtStsRpt": {
                    "GrpHdr": {
                      "MsgId": "BANKUS33-20240504-124500-001",
                      "CreDtTm": "2024-05-04T12:45:00"
                    },
                    "OrgnlGrpInfAndSts": {
                      "OrgnlMsgId": "S-BU-001",
                      "OrgnlMsgNmId": "pain.001.001.12"
                    },
                    "TxInfAndSts": {
                      "OrgnlEndToEndId": "abc123",
                      "TxSts": "ACCP"
                    }
                  }
                }
              },
              binData: null,
              messageHash: null,
              ticketId: '0',
              parent: 3,
              status: 'unverified'
            }
          )
          const {binary, hash} = await getBinaryMessage(this.pacs00200114(this.messages[3].message.Document.FIToFIPmtStsRpt), 'pacs.002.001.14', 3000);
          this.messages[3].binData = binary;
          this.messages[3].messageHash = hash;
        }
      },
      async handleMessageUpdate(jsonData) {
        this.isModalOpen = false;
        this.messages[this.selectedMessage].message = jsonData;
        console.log(jsonData)
        if(this.selectedMessage === 0 || this.selectedMessage === 2) {
          console.log(this.pain00100112Args(jsonData.Document.CstmrCdtTrfInitn));
          const {binary, hash} = await getBinaryMessage(this.pain00100112Args(jsonData.Document.CstmrCdtTrfInitn), 'pain.001.001.12', 3000);
          this.messages[this.selectedMessage].binData = binary;
          this.messages[this.selectedMessage].messageHash = hash;
        }else if (this.selectedMessage === 1){
          const {binary, hash} = await getBinaryMessage(this.fxtr01400105(jsonData.Document.FXTradInstr), 'fxtr.014.001.05', 3000);
          
          this.messages[this.selectedMessage].binData = binary;
          this.messages[this.selectedMessage].messageHash = hash;
        }else if(this.selectedMessage === 3) {
          const {binary, hash} = await getBinaryMessage(this.pacs00200114(jsonData.Document.FIToFIPmtStsRpt), 'pacs.002.001.14', 3000);
          
          this.messages[this.selectedMessage].binData = binary;
          this.messages[this.selectedMessage].messageHash = hash;
        }
      }
    }
  }
</script>