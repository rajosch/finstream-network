const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
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


// const protobuf = require('./pain_proto.js');

// function xmlToProtobuf(xmlPath) {
//     const xmlData = fs.readFileSync(xmlPath, 'utf8');
//     const parser = new xml2js.Parser();
//     parser.parseString(xmlData, (err, result) => {
//         if (err) {
//             console.error('Error parsing XML:', err);
//             return;
//         }
//         console.log('XML parsed successfully:', result);
        
//         // Here you would convert the JSON object `result` to a Protobuf object
//         // This involves mapping JSON fields to your Protobuf schema
//         // This is a placeholder for conversion logic
//     });
// }

const xmlPath = path.join(__dirname, '..', 'files/messages/pain.001.001.12', 'pain.001.001.12.xml');
const xsdPath = path.join(__dirname, '..', 'files/messages/pain.001.001.12', 'pain.001.001.12.xsd');

if (validateXML(xmlPath, xsdPath)) {
    console.log("Start XML to Protobuff");
    // xmlToProtobuf(xmlPath);  
}
