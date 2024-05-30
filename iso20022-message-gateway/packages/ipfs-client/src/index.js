const { createHelia } = require('helia');
const { unixfs } = require('@helia/unixfs');
const { json } = require('@helia/json');
const { dagJson } = require('@helia/dag-json');
const { CID } = require('multiformats/cid');

async function initHelia() {
  const helia = await createHelia();
  return helia;
}

async function addData(helia, data) {
  const fs = unixfs(helia);
  const encoder = new TextEncoder();
  const bytes = encoder.encode(data);
  const cid = await fs.addBytes(bytes);
  return cid.toString();
}

async function addJson(helia, obj) {
  const j = json(helia);
  const cid = await j.add(obj);
  return cid.toString();
}

async function addDagJson(helia, obj) {
  const d = dagJson(helia);
  const cid = await d.add(obj);
  return cid.toString();
}

async function getData(helia, cid) {
  const fs = unixfs(helia);
  const decoder = new TextDecoder();
  let text = '';
  for await (const chunk of fs.cat(CID.parse(cid))) {
    text += decoder.decode(chunk, { stream: true });
  }
  return text;
}

async function getJson(helia, cid) {
  const j = json(helia);
  return await j.get(CID.parse(cid));
}

async function getDagJson(helia, cid) {
  const d = dagJson(helia);
  return await d.get(CID.parse(cid));
}

async function createTicket(helia, message, additionalData) {
  const root = { message, additionalData, parent: null };
  const rootCid = await addDagJson(helia, root);
  return rootCid;
}

async function addToTicket(helia, parentCid, message, additionalData) {
  const ticket = { message, additionalData, parent: parentCid };
  const ticketCid = await addDagJson(helia, ticket);
  return ticketCid;
}

async function retrieveTicket(helia, rootCid) {
  const tickets = [];
  let currentCid = rootCid;
  while (currentCid) {
    const ticket = await getDagJson(helia, currentCid);
    tickets.push(ticket);
    currentCid = ticket.parent;
  }
  return tickets.reverse();
}

(async () => {
    await initHelia();
    // other code
})();


module.exports = {
  initHelia,
  addData,
  addJson,
  addDagJson,
  getData,
  getJson,
  getDagJson,
  createTicket,
  addToTicket,
  retrieveTicket
};
