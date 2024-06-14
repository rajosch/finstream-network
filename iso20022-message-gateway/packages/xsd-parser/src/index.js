const xml2js = require('xml2js');
const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: false });

const typeMapping = {
    'xs:string': 'string',
    'xs:int': 'int32',
    'xs:decimal': 'string', // Use string to preserve precision
    'xs:boolean': 'bool',
    'xs:date': 'string',
    'xs:dateTime': 'string', // Now using string for dateTime
    'xs:gYear': 'int32',
    'xs:base64Binary': 'bytes'
};

async function xsdToProto(data) {
    let protoFileContent = null;
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
        }else if(simpleTypes && !Array.isArray(simpleTypes)) {
            [simpleTypes].forEach((type) => {
                if (type['xs:restriction'] && type['xs:restriction']['$']) {
                    const baseType = type['xs:restriction']['$'].base;
                    const protobufType = typeMapping[baseType] || 'unknown';
                    simpleTypeMapping[type['$'].name] = protobufType;
                }
            });
        }

        protoFileContent = 'syntax = "proto3";\n\n';
        const complexTypes = result['xs:schema']['xs:complexType'];
        if (complexTypes && Array.isArray(complexTypes)) {
            complexTypes.forEach((type) => {
                if (type['xs:choice']) {
                    protoFileContent += `message ${type['$'].name} {\n`;
                    type['xs:choice']['xs:element'].forEach((element, index) => {
                        let fieldType = simpleTypeMapping[element['$'].type] || typeMapping[element['$'].type] || element['$'].type; 
                        protoFileContent += `  ${fieldType} ${element['$'].name} = ${index + 1};\n`;
                    });
                    protoFileContent += '}\n\n';
                } else if (type['xs:simpleContent']) {
                    const extension = type['xs:simpleContent']['xs:extension'];
                    const baseType = extension['$'].base;
                    const protoBaseType = typeMapping[baseType] || 'string';
                    const typeName = type['$'].name;

                    protoFileContent += `message ${typeName} {\n`;
                    protoFileContent += `  ${protoBaseType} Value = 1;\n`;

                    if (extension['xs:attribute']) {
                        const attributes = Array.isArray(extension['xs:attribute']) ? extension['xs:attribute'] : [extension['xs:attribute']];
                        attributes.forEach((attr, index) => {
                            const attrType = typeMapping[attr['$'].type] || 'string';
                            protoFileContent += `  ${attrType} ${attr['$'].name} = ${index + 2};\n`;
                        });
                    }
                    protoFileContent += '}\n\n';
                } else if (type['xs:sequence']) {
                    protoFileContent += `message ${type['$'].name} {\n`;
                    if (Array.isArray(type['xs:sequence']['xs:element'])) {
                        type['xs:sequence']['xs:element'].forEach((element, index) => {
                            let fieldType = simpleTypeMapping[element['$'].type] || typeMapping[element['$'].type] || element['$'].type; 
                            protoFileContent += `  ${fieldType} ${element['$'].name} = ${index + 1};\n`;
                        });
                    } else if (type['xs:sequence']['xs:element']) {
                        Array.from(type['xs:sequence']['xs:element']).forEach((element, index) => {
                            let fieldType = simpleTypeMapping[element['$'].type] || typeMapping[element['$'].type] || element['$'].type; 
                            protoFileContent += `  ${fieldType} ${element['$'].name} = ${index + 1};\n`;
                        });
                    }
                    protoFileContent += '}\n\n';
                }
            });
        }
    });
    
    if (protoFileContent) {
        protoFileContent = protoFileContent.trimEnd();
        if (protoFileContent.endsWith('\n\n')) {
            protoFileContent = protoFileContent.slice(0, -2);
        }
    }

    return protoFileContent;
}

module.exports = {
    xsdToProto
};
