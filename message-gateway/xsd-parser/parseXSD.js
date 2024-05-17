const fs = require('fs');
const xml2js = require('xml2js');
const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: false });

const xsdPath = '../files/messages/pain.001.001.12/pain.001.001.12.xsd';
const outputPath = '../output/pain.001.001.12.proto';

const typeMapping = {
    'xs:string': 'string',
    'xs:decimal': 'string', // Use string to preserve precision
    'xs:boolean': 'bool',
    'xs:date': 'string',
    'xs:dateTime': 'string', // Now using string for dateTime
    'xs:gYear': 'int32',
    'xs:base64Binary': 'bytes'
};

fs.readFile(xsdPath, (err, data) => {
    if (err) throw err;

    parser.parseString(data, (err, result) => {
        if (err) throw err;

        const simpleTypes = result['xs:schema']['xs:simpleType'];
        const simpleTypeMapping = {};
        if (simpleTypes && Array.isArray(simpleTypes)) {
            simpleTypes.forEach((type) => {
                if (type['xs:restriction'] && type['xs:restriction']['$']) {
                    const baseType = type['xs:restriction']['$'].base;
                    const protobufType = typeMapping[baseType] || 'unknown';
                    simpleTypeMapping[type['$'].name] = protobufType;
                }
            });
        }

        let protoFileContent = 'syntax = "proto3";\n\n';
        const complexTypes = result['xs:schema']['xs:complexType'];
        if (complexTypes && Array.isArray(complexTypes)) {
            complexTypes.forEach((type) => {
                if (type['xs:choice']) {
                    protoFileContent += `message ${type['$'].name} {\n`;
                    type['xs:choice']['xs:element'].forEach((element, index) => {
                        let fieldType = simpleTypeMapping[element['$'].type] || element['$'].type; 
                        protoFileContent += `  ${fieldType} ${element['$'].name} = ${index + 1};\n`;
                    });
                    protoFileContent += '}\n\n';
                }else if (type['xs:simpleContent']) {
                    // Not sure yet if and how I can generalize this
                    protoFileContent += `message ActiveOrHistoricCurrencyAndAmount {\n\tstring amount = 1;\n\tstring Ccy = 2;\n}\n\n`;


                }else if (type['xs:sequence']) {
                    protoFileContent += `message ${type['$'].name} {\n`;
                    if(Array.isArray(type['xs:sequence']['xs:element'])) {
                        type['xs:sequence']['xs:element'].forEach((element, index) => {
                            let fieldType = simpleTypeMapping[element['$'].type] ||  element['$'].type; 
                            protoFileContent += `  ${fieldType} ${element['$'].name} = ${index + 1};\n`;
                        });
                    }else if(type['xs:sequence']['xs:element']) {
                        Array.from(type['xs:sequence']['xs:element']).forEach((element, index) => {
                            let fieldType = simpleTypeMapping[element['$'].type] ||  element['$'].type; 
                            protoFileContent += `  ${fieldType} ${element['$'].name} = ${index + 1};\n`;
                        });
                    }
                    protoFileContent += '}\n\n';
                } 
            });
        }

        fs.writeFile(outputPath, protoFileContent, (err) => {
            if (err) throw err;
            console.log('Protobuf file has been saved.');
        });
    });
});



// function calculateMaxLength(restriction) {
//     // Handle maxLength directly
//     if (restriction['xs:maxLength']) {
//         return restriction['xs:maxLength']['$'].value;
//     }

//     // Handle enumeration by finding the longest value
//     if (restriction['xs:enumeration']) {
//         return Math.max(...restriction['xs:enumeration'].map(enumVal => enumVal['$'].value.length));
//     }

//     // Handle pattern by estimating the maximum length from the pattern
//     if (restriction['xs:pattern']) {
//         return estimateLengthFromPattern(restriction['xs:pattern']['$'].value);
//     }

//     return NaN; // Return NaN if no relevant restriction found
// }


// function estimateLengthFromPattern(pattern) {
//     let maxChars = 0;
//     const parts = pattern.match(/(\[.*?\])(\{\d+,\d+\})?/g);
//     if (parts) {
//         parts.forEach(part => {
//             console.log(part)
//             const numbers = part.match(/\d+/g);
//             if (numbers) {
//                 const [min, max] = numbers;
//                 maxChars += parseInt(max || min, 10);  // Use max if available, else min
//             }
//         });
//     }
//     console.log(`Pattern: ${pattern}, Estimated Max Length: ${maxChars}`);
//     return maxChars;
// }
