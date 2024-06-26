const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const libxmljs = require('libxmljs2');

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

async function validateXML(xmlContent, xsdContent) {
    const tempDir = os.tmpdir();

    // Create temporary files for the XML and XSD content
    const xmlPath = path.join(tempDir, 'temp.xml');
    const xsdPath = path.join(tempDir, 'temp.xsd');

    await writeFileAsync(xmlPath, xmlContent);
    await writeFileAsync(xsdPath, xsdContent);

    try {
        const xmlDoc = libxmljs.parseXml(xmlContent);
        const xsdDoc = libxmljs.parseXml(xsdContent);

        const isValid = xmlDoc.validate(xsdDoc);
        if (isValid) {
            return { valid: true, errors: [] };
        } else {
            const errors = parseLibxmljsErrors(xmlDoc.validationErrors);
            return { valid: false, errors: errors };
        }
    } catch (error) {
        return { valid: false, errors: [error.message] };
    } finally {
        // Clean up temporary files
        await unlinkAsync(xmlPath);
        await unlinkAsync(xsdPath);
    }
}

function parseLibxmljsErrors(validationErrors) {
    return validationErrors.map(error => ({
        message: error.message,
        line: error.line,
        column: error.column
    }));
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
