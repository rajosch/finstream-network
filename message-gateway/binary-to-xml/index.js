const protobuf = require('protobufjs');
const fs = require('fs');
const xml2js = require('xml2js');

const messages = [
  'pain.001.001.12',
  'fxtr.014.001.05',
  'pain.001.001.12',
  'pain.001.001.12',
  'pacs.002.001.14'
]

for (let index in messages) {
  parseBinToXML(messages[index], index);
}

function parseBinToXML(messageType, messageNumber) {
  const protoFilePath = `../files/protobuf/${messageType}.proto`;
  const binFilePath = `../output/msg${messageNumber}-${messageType}.bin`;
  const xmlFilePath = `../output/msg${messageNumber}-${messageType}.xml`;
  const namespace = "urn:iso:std:iso:20022:tech:xsd:";

  protobuf.load(protoFilePath, (err, root) => {
    if (err) {
      throw err;
    }

    const Document = root.lookupType('Document');

    fs.readFile(binFilePath, (err, data) => {
      if (err) {
        throw err;
      }

      const message = Document.decode(data);

      const object = Document.toObject(message, {
        longs: String,
        enums: String,
        bytes: String,
      });

      const json = JSON.stringify(object, null, 2);

      console.log(json);

      const wrappedObject = { Document: { $: { xmlns: namespace + messageType }, ...object } };

      // Custom function to convert the object to the desired XML structure
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
          encoding: 'UTF-8',
        }
      });

      const xml = builder.buildObject(adjustedObject);

      fs.writeFile(xmlFilePath, xml, (err) => {
        if (err) {
          throw err;
        }
        console.log(`XML has been saved to ${xmlFilePath}`);
      });
    });
  });
}
