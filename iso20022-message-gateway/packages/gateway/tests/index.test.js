const { createMessage, orderMessages } = require('../src/utils/message');
const { validateXML, xmlToBin } = require('../../xml-processor');
const protobuf = require('protobufjs');
const path = require('path');
const fs = require('fs');
const { ethers } = require('ethers');

jest.mock('../../xml-processor', () => ({
  validateXML: jest.fn(),
  xmlToBin: jest.fn(),
}));

describe('createMessage', () => {
  const ticketId = "ticket123";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create and validate a pain.001.001.12 message', async () => {
    const messageArgs = {
      msgId: 'S-BU-001',
      creDtTm: '2024-05-04T12:38:00',
      nbOfTxs: '1',
      ctrlSum: '1000.00',
      initgPtyNm: 'Alice',
      pmtInfId: 'X-BA-PAY001',
      pmtMtd: 'TRF',
      pmtTpInfSvcLvlCd: 'NORM',
      reqdExctnDt: '2024-05-04T14:00:00',
      dbtrNm: 'Alice',
      dbtrAcctIBAN: 'US33XXX1234567890123456789012',
      dbtrAgtBICFI: 'BANKUS22',
      endToEndId: 'abc123',
      instdAmtCcy: 'USD',
      instdAmt: '1000.00',
      cdtrAgtBICFI: 'BANKEU11',
      cdtrAcctIBAN: 'DE89370400440532013000'
    };
    const messageType = 'pain.001.001.12';
    const xsdPath = path.join(__dirname, '../../../../files/definitions', `${messageType}.xsd`);
    const protoPath = path.join(__dirname, '../../../../files/protobuf', `${messageType}.proto`);

    const root = protobuf.loadSync(protoPath);
    const xsdContent = fs.readFileSync(xsdPath, 'utf-8');
    
    validateXML.mockReturnValue(true);
    xmlToBin.mockResolvedValue(Buffer.from('binary data'));

    const result = await createMessage(messageType, messageArgs, ticketId, xsdContent, root, null);

    const buffer = Buffer.from('binary data');
    const messageHash = ethers.keccak256(buffer);

    expect(validateXML).toHaveBeenCalledWith(expect.any(String), xsdContent);
    expect(xmlToBin).toHaveBeenCalledWith(expect.any(String), expect.any(Object), 'Document');
    expect(result).toEqual({
      data: buffer,
      parent: null,
      messageHash: messageHash,
      ticketId: ticketId
    });
  });

  it('should return null if message type is invalid', async () => {
    const messageType = 'invalid.message.type';
    const messageArgs = {};
    
    const result = await createMessage(messageType, messageArgs, ticketId);
    
    expect(result).toBeNull();
  });

  it('should return null if XML validation fails', async () => {
    const messageArgs = {
      msgId: 'S-BU-001',
      creDtTm: '2024-05-04T12:38:00',
      nbOfTxs: '1',
      ctrlSum: '1000.00',
      initgPtyNm: 'Alice',
      pmtInfId: 'X-BA-PAY001',
      pmtMtd: 'TRF',
      pmtTpInfSvcLvlCd: 'NORM',
      reqdExctnDt: '2024-05-04T14:00:00',
      dbtrNm: 'Alice',
      dbtrAcctIBAN: 'US33XXX1234567890123456789012',
      dbtrAgtBICFI: 'BANKUS22',
      endToEndId: 'abc123',
      instdAmtCcy: 'USD',
      instdAmt: '1000.00',
      cdtrAgtBICFI: 'BANKEU11',
      cdtrAcctIBAN: 'DE89370400440532013000'
    };
    const messageType = 'pain.001.001.12';
    const xsdPath = path.join(__dirname, '../../../../files/definitions', `${messageType}.xsd`);
    const protoPath = path.join(__dirname, '../../../../files/protobuf', `${messageType}.proto`);

    const root = protobuf.loadSync(protoPath);
    const xsdContent = fs.readFileSync(xsdPath, 'utf-8');
    
    validateXML.mockReturnValue(false);

    const result = await createMessage(messageType, messageArgs, ticketId, xsdContent, root, null);

    expect(validateXML).toHaveBeenCalledWith(expect.any(String), xsdContent);
    expect(result).toBeNull();
  });
});

describe('orderMessages', () => {
  it('should order messages starting with parent=null and so on', () => {
    const messages = [
      { id: 5, encryptedData: 'data5', iv: 'iv5', messageHash: 'hash5', ticketId: 'ticket1', parent: 4 },
      { id: 1, encryptedData: 'data1', iv: 'iv1', messageHash: 'hash1', ticketId: 'ticket1', parent: null },
      { id: 6, encryptedData: 'data6', iv: 'iv6', messageHash: 'hash6', ticketId: 'ticket1', parent: 5 },
      { id: 4, encryptedData: 'data4', iv: 'iv4', messageHash: 'hash4', ticketId: 'ticket1', parent: 1 },
    ];

    const expectedOrderedMessages = [
      { id: 1, encryptedData: 'data1', iv: 'iv1', messageHash: 'hash1', ticketId: 'ticket1', parent: null },
      { id: 4, encryptedData: 'data4', iv: 'iv4', messageHash: 'hash4', ticketId: 'ticket1', parent: 1 },
      { id: 5, encryptedData: 'data5', iv: 'iv5', messageHash: 'hash5', ticketId: 'ticket1', parent: 4 },
      { id: 6, encryptedData: 'data6', iv: 'iv6', messageHash: 'hash6', ticketId: 'ticket1', parent: 5 }
    ];

    const result = orderMessages(messages);
    expect(result).toEqual(expectedOrderedMessages);
  });

  it('should throw an error if there is not exactly one root message', () => {
    const messagesWithNoRoot = [
      { id: 2, encryptedData: 'data2', iv: 'iv2', messageHash: 'hash2', ticketId: 'ticket1', parent: 1 }
    ];

    const messagesWithMultipleRoots = [
      { id: 1, encryptedData: 'data1', iv: 'iv1', messageHash: 'hash1', ticketId: 'ticket1', parent: null },
      { id: 2, encryptedData: 'data2', iv: 'iv2', messageHash: 'hash2', ticketId: 'ticket1', parent: null }
    ];

    expect(() => orderMessages(messagesWithNoRoot)).toThrow('There should be exactly one root message');
    expect(() => orderMessages(messagesWithMultipleRoots)).toThrow('There should be exactly one root message');
  });
});
