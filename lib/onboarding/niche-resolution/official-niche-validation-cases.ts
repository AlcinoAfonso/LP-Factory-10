import assert from "node:assert/strict";
import nodeModule from "node:module";
const loader=nodeModule as unknown as {_load:(name:string,parent:unknown,isMain:boolean)=>unknown};
const original=loader._load;
const accountId="10000000-0000-4000-8000-000000000001";
const taxonId="10000000-0000-4000-8000-000000000002";
const stamp="2026-11-13T00:00:00Z";
let accepted:string|null=stamp;
loader._load=function(name,parent,isMain){
  if(name==="server-only")return {};
  if(name==="@/lib/supabase/service")return {createServiceClient:()=>({from(table:string){
    let columns="";
    const chain={select(value:string){columns=value;return chain;},eq(){return chain;},limit(){return chain;},
      async maybeSingle(){
        if(table==="account_official_niches")return {data:null,error:null};
        if(table==="account_taxonomy")return {data:{taxon_id:taxonId,source_type:"taxonomy_match",updated_at:stamp,...(columns.includes("user_confirmed_at")?{user_confirmed_at:accepted}:{})},error:null};
        if(table==="business_taxons")return {data:{id:taxonId,name:"Jardinagem",slug:"jardinagem"},error:null};
        if(table==="account_niche_resolutions")return {data:null,error:null};
        throw Error("Unexpected table "+table);
      }};
    return chain;
  }})};
  return original.call(this,name,parent,isMain);
};
async function main(){
  const {readAccountOfficialNiche}=await import("./adapters/accountOfficialNicheAdapter");
  loader._load=original;
  const prior=process.env.D14D_ACCOUNT_NICHE_EDITING_ENABLED;
  try{
    for(const value of [undefined,"false","true"]){
      if(value===undefined)delete process.env.D14D_ACCOUNT_NICHE_EDITING_ENABLED;
      else process.env.D14D_ACCOUNT_NICHE_EDITING_ENABLED=value;
      accepted=stamp;
      const confirmed=await readAccountOfficialNiche(accountId);
      assert.ok(confirmed.ok&&confirmed.niche?.confirmed,"persisted acceptance is independent of editing flag "+value);
      if(confirmed.ok)assert.equal(confirmed.niche?.confirmedAt,stamp);
      accepted=null;
      const unconfirmed=await readAccountOfficialNiche(accountId);
      assert.ok(unconfirmed.ok&&unconfirmed.niche?.confirmed===false,"automatic taxonomy remains unconfirmed "+value);
    }
    console.log("PASS official niche legacy confirmation is independent of D14D editing flag; automatic matches stay unconfirmed");
  }finally{if(prior===undefined)delete process.env.D14D_ACCOUNT_NICHE_EDITING_ENABLED;else process.env.D14D_ACCOUNT_NICHE_EDITING_ENABLED=prior;}
}
void main();
