const { initHelia, createTicket, addToTicket, retrieveTicket, addData, getData, addJson, getJson, addDagJson, getDagJson } = require('../src/index');

describe('IPFS Ticket System', () => {
  let helia;

  beforeAll(async () => {
    helia = await initHelia();
  });

  describe('Basic Helia Operations', () => {
    test('add and get data', async () => {
      const data = 'Hello World';
      const cid = await addData(helia, data);
      const retrievedData = await getData(helia, cid);
      expect(retrievedData).toBe(data);
    });

    test('add and get JSON', async () => {
      const obj = { hello: 'world' };
      const cid = await addJson(helia, obj);
      const retrievedObj = await getJson(helia, cid);
      expect(retrievedObj).toEqual(obj);
    });

    test('add and get DAG-JSON', async () => {
      const obj = { hello: 'world' };
      const cid = await addDagJson(helia, obj);
      const retrievedObj = await getDagJson(helia, cid);
      expect(retrievedObj).toEqual(obj);
    });
  });

  describe('Ticket System Operations', () => {
    let rootCid, childCid, grandChildCid;

    test('create root ticket', async () => {
      rootCid = await createTicket(helia, 'Initial message', { info: 'root' });
      expect(rootCid).toBeDefined();
    });

    test('add child ticket', async () => {
      childCid = await addToTicket(helia, rootCid, 'Child message', { info: 'child' });
      expect(childCid).toBeDefined();
    });

    test('add grandchild ticket', async () => {
      grandChildCid = await addToTicket(helia, childCid, 'Grandchild message', { info: 'grandchild' });
      expect(grandChildCid).toBeDefined();
    });

    test('retrieve entire ticket chain', async () => {
      const tickets = await retrieveTicket(helia, grandChildCid);
      expect(tickets).toEqual([
        { message: 'Initial message', additionalData: { info: 'root' }, parent: null },
        { message: 'Child message', additionalData: { info: 'child' }, parent: rootCid },
        { message: 'Grandchild message', additionalData: { info: 'grandchild' }, parent: childCid }
      ]);
    });
  });
});
