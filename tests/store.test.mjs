import assert from 'node:assert/strict';

const data=new Map();
globalThis.localStorage={
  getItem:k=>data.has(k)?data.get(k):null,
  setItem:(k,v)=>data.set(k,String(v)),
  removeItem:k=>data.delete(k)
};

const {loadState,saveState,resetState,importBackup,defaultState}=await import('../src/store.js');

resetState();
let state=loadState();
assert.equal(state.schemaVersion,5);
assert.ok(state.meta.createdAt);
state.transactions.push({id:'t1',date:'2026-08-27',description:'Test',amount:5,type:'expense'});
state=saveState(state);
assert.equal(loadState().transactions.length,1);

const wrapped={format:'OpenBudgetBackup',backupVersion:1,exportedAt:'2026-08-27T00:00:00.000Z',data:state};
const imported=await importBackup({size:1000,text:async()=>JSON.stringify(wrapped)});
assert.equal(imported.transactions[0].description,'Test');

const legacy=await importBackup({size:1000,text:async()=>JSON.stringify(state)});
assert.equal(legacy.schemaVersion,5,'Legacy direct-state backups remain importable');

await assert.rejects(()=>importBackup({size:11*1024*1024,text:async()=>''}),/larger than 10 MB/);
await assert.rejects(()=>importBackup({size:100,text:async()=>'{bad'}),/not valid JSON/);
await assert.rejects(()=>importBackup({size:100,text:async()=>JSON.stringify({foo:'bar'})}),/missing required OpenBudget data/);

console.log('OpenBudget storage, backup, and migration tests passed');
