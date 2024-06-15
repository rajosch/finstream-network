const { createMessage } = require('../src');
const { encryptFile } = require('../../multi-party-encrypter');
const { validateXML, xmlToBin } = require('../../xml-processor');
const protobuf = require('protobufjs');
const path = require('path');
const fs = require('fs');

jest.mock('../../xml-processor', () => ({
  validateXML: jest.fn(),
  xmlToBin: jest.fn(),
}));

jest.mock('../../multi-party-encrypter', () => ({
  encryptFile: jest.fn(),
}));

describe('createMessage', () => {
  const wallets = ["wallet1", "wallet2"];
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
    encryptFile.mockResolvedValue('encrypted data');

    const result = await createMessage(messageType, wallets, messageArgs, ticketId, xsdContent, root);

    expect(validateXML).toHaveBeenCalledWith(expect.any(String), xsdContent);
    expect(xmlToBin).toHaveBeenCalledWith(expect.any(String), expect.any(Object), 'Document');
    expect(encryptFile).toHaveBeenCalledWith(Buffer.from('binary data'), wallets, null, ticketId);
    expect(result).toBe('encrypted data');
  });

  it('should return null if message type is invalid', async () => {
    const messageType = 'invalid.message.type';
    const messageArgs = {};
    
    const result = await createMessage(messageType, wallets, messageArgs, ticketId);
    
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

    const result = await createMessage(messageType, wallets, messageArgs, ticketId, xsdContent, root);

    expect(validateXML).toHaveBeenCalledWith(expect.any(String), xsdContent);
    expect(result).toBeNull();
  });
});
