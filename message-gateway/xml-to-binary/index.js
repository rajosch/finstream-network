const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const protobuf = require('protobufjs');
const xml2js = require('xml2js');

const msgFiles = [
    'pain.001.001.12',
    'fxtr.014.001.05',
    'pain.001.001.12',
    'pain.001.001.12',
    'pacs.002.001.14',
];

function validateXML(xmlPath, xsdPath) {
    try {
        const result = execSync(`xmllint --noout --schema ${xsdPath} ${xmlPath}`);
        console.log('Validation successful!');
        console.log(result.toString());
        return { valid: true, errors: [] };
    } catch (error) {
        const errors = parseXmllintErrors(error.stderr.toString());
        saveErrorsToJson(errors);
        return { valid: false, errors: errors };
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

function saveErrorsToJson(errors) {
    const outputPath = path.join(__dirname, '../output');
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath);
    }
    const date = new Date().toISOString().replace(/[:]/g, '-').split('.')[0]; 
    const filename = `xmllinterrors-${date}.json`;
    fs.writeFileSync(path.join(outputPath, filename), JSON.stringify(errors, null, 2), 'utf8');
    console.log(`Errors saved to ${filename}`);
}

function xmlToProtobuf(xmlPath, protoPath, messageName) {
    // Load the protobuf schema
    const root = protobuf.loadSync(protoPath);
    const Document = root.lookupType('Document');

    const parser = new xml2js.Parser();

    fs.readFile(xmlPath, (err, data) => {
        if (err) throw err;

        parser.parseString(data, (err, result) => {
            if (err) throw err;

            // Function to construct the object based on XML structure
            const constructObject = (xmlObj) => {
                const resultObj = {};
                for (let key in xmlObj) {
                    console.log(key)
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

            // Construct the document object dynamically
            const document = constructObject(result.Document);
            console.log("Document Message:", JSON.stringify(document, null, 2));

            // Create a new Document message
            const message = Document.create(document);

            console.log("Message:", JSON.stringify(message, null, 2));

            // Encode the message to a .bin file
            const buffer = Document.encode(message).finish();
            console.log(buffer.toString())
            fs.writeFile(`../output/${messageName}.bin`, buffer, (err) => {
                if (err) {
                    console.error(`Error writing binary file: ${err}`);
                } else {
                    console.log(`Successfully created ../output/${messageName}.bin`);
                }
            });
            console.log('XML converted to .bin successfully.');
        });
    });
}


for(index in msgFiles) {
    const xmlPath = path.join(__dirname, '..', 'files/messages', 'msg' + index + '-' + msgFiles[index] + '.xml');
    const xsdPath = path.join(__dirname, '..', 'files/definitions', msgFiles[index] + '.xsd');
    const protoPath = path.join(__dirname, '..', 'files/protobuf', msgFiles[index] + '.proto');

    if (validateXML(xmlPath, xsdPath).valid) {
        xmlToProtobuf(xmlPath, protoPath, 'msg' + index + '-' + msgFiles[index]);
    }
}


