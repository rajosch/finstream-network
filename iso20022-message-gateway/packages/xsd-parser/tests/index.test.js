const { xsdToProto } = require('../src/index');
const fs = require('fs');
const path = require('path');

describe('XSD to Proto Converter', () => {
    let xsdData;
    let expectedProto;

    beforeAll(() => {
        const directoryPath = path.join(__dirname, '../../../../output');

        try {
            fs.mkdirSync(directoryPath, { recursive: true });
            console.log('Directory created successfully.');
        } catch (err) {
            console.error('Error creating directory:', err);
        }

        const xsdPath = path.join(__dirname, '../../../../files/definitions', 'sample.xsd');
        xsdData = fs.readFileSync(xsdPath, 'utf8');

        const protoPath = path.join(__dirname, '../../../../files/protobuf', 'expected_sample.proto');
        expectedProto = fs.readFileSync(protoPath, 'utf8');
    });

    test('xsdToProto should convert XSD to Proto format correctly', async () => {
        const resultProto = await xsdToProto(xsdData);

        expect(resultProto).toBe(expectedProto);

        const outputPath = path.join(__dirname, '../../../../output', 'sample.proto');

        try {
            fs.promises.writeFile(outputPath, resultProto);
        } catch (err) {
            console.error(`Error writing proto file: ${err}`);
        }
    });

    test('xsdToProto should handle complex types with sequences correctly', async () => {
        const complexTypeXsdPath = path.join(__dirname, '../../../../files/definitions', 'complex_type.xsd');
        const complexTypeXsdData = fs.readFileSync(complexTypeXsdPath, 'utf8');
        
        const expectedComplexProtoPath = path.join(__dirname, '../../../../files/protobuf', 'expected_complex_type.proto');
        const expectedComplexProto = fs.readFileSync(expectedComplexProtoPath, 'utf8');

        const resultProto = await xsdToProto(complexTypeXsdData);

        expect(resultProto).toBe(expectedComplexProto);

        const outputPath = path.join(__dirname, '../../../../output', 'complex_type.proto');

        try {
            fs.promises.writeFile(outputPath, resultProto);
        } catch (err) {
            console.error(`Error writing proto file: ${err}`);
        }
    });
});
