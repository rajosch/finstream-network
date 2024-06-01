import { execSync } from 'child_process';
import xml2js from 'xml2js';
import fs from 'fs';
import path from 'path';
import os from 'os';

function validateXML(xmlContent, xsdContent) {
    const tempDir = os.tmpdir();

    // Create temporary files for the XML and XSD content
    const xmlPath = path.join(tempDir, 'temp.xml');
    const xsdPath = path.join(tempDir, 'temp.xsd');

    fs.writeFileSync(xmlPath, xmlContent);
    fs.writeFileSync(xsdPath, xsdContent);

    try {
        execSync(`xmllint --noout --schema ${xsdPath} ${xmlPath}`);
        return { valid: true, errors: [] };
    } catch (error) {
        const errors = parseXmllintErrors(error.stderr.toString());
        return { valid: false, errors: errors };
    } finally {
        // Clean up temporary files
        fs.unlinkSync(xmlPath);
        fs.unlinkSync(xsdPath);
    }
}

function parseXmllintErrors(stderr) {
    const lines = stderr.split('\n');
    return lines.filter(line => line.trim() !== '').map(line => {
        const parts = line.split(':');
        if (parts.length >= 4) {
            return {
                file: parts[0].trim(),
                line: parseInt(parts[1].trim(), 10),
                column: parseInt(parts[2].trim(), 10),
                message: parts.slice(3).join(':').trim()
            };
        }
        return { message: line.trim() };
    });
}

function xmlToBin(data, root, msgType) {
    return new Promise((resolve, reject) => {
        const RootElement = root.lookupType(msgType);
        const parser = new xml2js.Parser();

        parser.parseString(data, (err, result) => {
            if (err) {
                reject(err);
                return;
            }

            const constructObject = (xmlObj) => {
                const resultObj = {};
                for (let key in xmlObj) {
                    if (key !== '$') {
                        if (Array.isArray(xmlObj[key]) && typeof xmlObj[key][0] === 'object') {
                            if (key === 'Amt') {
                                resultObj[key] = constructAmtObject(xmlObj[key][0]);
                            } else {
                                resultObj[key] = constructObject(xmlObj[key][0]);
                            }
                        } else if (Array.isArray(xmlObj[key])) {
                            resultObj[key] = xmlObj[key][0];
                        } else {
                            resultObj[key] = xmlObj[key];
                        }
                    }
                }
                return resultObj;
            };

            const constructAmtObject = (xmlObj) => {
                const resultObj = {};
                for (let key in xmlObj) {
                    if (key === 'InstdAmt' && typeof xmlObj[key][0] === 'object') {
                        resultObj['InstdAmt'] = parseFloat(xmlObj[key][0]._);
                        if (xmlObj[key][0].$ && xmlObj[key][0].$.Ccy) {
                            resultObj['Ccy'] = xmlObj[key][0].$.Ccy;
                        }
                    } else {
                        resultObj[key] = xmlObj[key];
                    }
                }
                return resultObj;
            };

            const rootElement = constructObject(result[msgType]);

            const message = RootElement.create(rootElement);

            const buffer = RootElement.encode(message).finish();

            resolve(buffer);
        });
    });
}

function binToXML(binData, root, msgType, msgId) {
    const namespace = "urn:iso:std:iso:20022:tech:xsd:";

    const RootElement = root.lookupType(msgType);

    const message = RootElement.decode(binData);

    const object = RootElement.toObject(message, {
        longs: String,
        enums: String,
        bytes: String,
    });

    const wrappedObject = { [msgType]: { $: { xmlns: namespace + msgId }, ...object } };

    const convertObjectToXmlStructure = (obj) => {
        const resultObj = {};
        for (let key in obj) {
        if (key === 'Amt' && obj[key].InstdAmt && obj[key].Ccy) {
            resultObj[key] = {
            InstdAmt: {
                _: obj[key].InstdAmt,
                $: { Ccy: obj[key].Ccy }
            }
            };
        } else if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
            resultObj[key] = convertObjectToXmlStructure(obj[key]);
        } else {
            resultObj[key] = obj[key];
        }
        }
        return resultObj;
    };

    const adjustedObject = convertObjectToXmlStructure(wrappedObject);

    const builder = new xml2js.Builder({
        xmldec: {
            version: '1.0',
            encoding: 'UTF-8'
        }
    });

    const xml = builder.buildObject(adjustedObject);

    return xml;
}  

module.exports = {
    validateXML,
    xmlToBin,
    binToXML
};
