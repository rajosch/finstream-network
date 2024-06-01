const { validateXML, xmlToBin, binToXML } = require('../src/index');
const fs = require('fs');
const path = require('path');
const protobuf = require('protobufjs');

describe('XML Processor Library', () => {
    beforeAll(() => {
        const directoryPath = path.join(__dirname, '../../../../output');

        try {
            fs.mkdirSync(directoryPath, { recursive: true });
            console.log('Directory created successfully.');
        } catch (err) {
            console.error('Error creating directory:', err);
        }
    });

    afterAll(() => {});

    test('validateXML should return valid for a correct XML file', () => {
        const xmlPath = path.join(__dirname, '../../../../files/messages', 'msg0-pain.001.001.12.xml');
        const xsdPath = path.join(__dirname, '../../../../files/definitions', 'pain.001.001.12.xsd');

        const data = fs.readFileSync(xmlPath); 
        const xsdContent = fs.readFileSync(xsdPath); 
        const result = validateXML(data.toString(), xsdContent);
        expect(result.valid).toBe(true);
        expect(result.errors.length).toBe(0);
    });

    test('validateXML should return errors for an incorrect XML file', () => {
        const xmlPath = path.join(__dirname, '../../../../files/messages', 'errorMessage.xml');
        const xsdPath = path.join(__dirname, '../../../../files/definitions', 'pacs.002.001.14.xsd');

        const data = fs.readFileSync(xmlPath); 
        const xsdContent = fs.readFileSync(xsdPath); 
        const result = validateXML(data.toString(), xsdContent);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });

    test('xmlToBin should create binary from XML file', async () => {
        const xmlPath = path.join(__dirname, '../../../../files/messages', 'msg0-pain.001.001.12.xml');
        const protoPath = path.join(__dirname, '../../../../files/protobuf', 'pain.001.001.12.proto');
    
        const data = fs.readFileSync(xmlPath); 
        const root = protobuf.loadSync(protoPath);
        const buffer = await xmlToBin(data, root, 'Document');
    
        expect(buffer instanceof Buffer || buffer instanceof Uint8Array).toBe(true);
        expect(buffer.length).toBeGreaterThan(0);
    
        const outputPath = path.join(__dirname, '../../../../output', 'sample.bin');
    
        try {
            fs.promises.writeFile(outputPath, buffer); 
        } catch (err) {
            console.error(`Error writing binary file: ${err}`);
        }
    });    

    test('binToXML should create XML from binary', () => {
        const binFilePath = path.join(__dirname, '../../../../files/binary', 'sample.bin');
        const protoFilePath = path.join(__dirname, '../../../../files/protobuf', 'pain.001.001.12.proto');

        const data = fs.readFileSync(binFilePath); 
        const root = protobuf.loadSync(protoFilePath);

        const xml = binToXML(data, root, 'Document', 'pain.001.001.12');
        const outputPath = path.join(__dirname, '../../../../output', 'sample.xml');
    
        try {
            fs.promises.writeFile(outputPath, xml); 
        } catch (err) {
            console.error(`Error writing binary file: ${err}`);
        }
    });
});
