const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const protobuf = require('protobufjs');
const xml2js = require('xml2js');

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

function xmlToProtobuf(xmlPath) {
    // Load your .proto file
    const root = protobuf.loadSync(path.join(__dirname, '..', 'output', 'pain.001.001.12.proto'));
    const Document = root.lookupType('Document'); 

    // Read the XML file
    fs.readFile(xmlPath, 'utf-8', (err, data) => {
        if (err) throw err;

        // Parse the XML file
        xml2js.parseString(data, { mergeAttrs: true, explicitArray: false }, (err, result) => {
            if (err) throw err;

            // Dynamically map the parsed XML to the structure expected by Protobuf
            const message = mapXmlToProtobuf(Document, result.Document);

            // Verify the message if needed
            const errMsg = Document.verify(message);
            if (errMsg) throw Error(errMsg);

            // Create a new message
            const messageInstance = Document.create(message);

            // Encode the message to binary
            const buffer = Document.encode(messageInstance).finish();

            // Write the binary data to a file
            // const outputPath = path.join(__dirname, '../output');
            // if (!fs.existsSync(outputPath)) {
            //     fs.mkdirSync(outputPath);
            // }
            // fs.writeFileSync(path.join(outputPath, 'output.bin'), buffer);
            console.log('Binary file has been saved.');
        });
    });
}

function mapXmlToProtobuf(protoType, xmlObj) {
    const message = {};

    for (const [key, value] of Object.entries(xmlObj)) {
        // console.log(protoType.fields)
        const field = protoType.fields[key];
        if(field) {
            console.log(field.resolvedType)
        }else {
            console.warn(`Warning: Field ${key} not found in Protobuf definition`);
            continue;
        }
        // if (field === null) {
        // }
        
        // if (typeof value === 'object' && !Array.isArray(value)) {
        //     message[key] = mapXmlToProtobuf(field.resolvedType, value);
        // } else {
        //     message[key] = value;
        // }
    }

    return message;
}

const xmlPath = path.join(__dirname, '..', 'files/messages', 'msg4-pain.001.001.12.xml');
const xsdPath = path.join(__dirname, '..', 'files/definitions', 'pain.001.001.12.xsd');

if (validateXML(xmlPath, xsdPath).valid) {
    console.log("Start XML to Protobuf");
    // xmlToProtobuf(xmlPath);
}
