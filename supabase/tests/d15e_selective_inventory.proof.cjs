
const assert=require("node:assert/strict"),fs=require("node:fs"),os=require("node:os"),path=require("node:path"),{execFileSync}=require("node:child_process");
assert.ok(process.argv[2],"Pass the already installed Bash executable");
const text=fs.readFileSync(".github/workflows/pipeline-supabase-apply-migrations.yml","utf8").replace(/\r\n/g,"\n");
const blocks=[...text.matchAll(/^        run: \|\n((?: {10}.*\n|\n)*)/gm)].map(match=>match[1].split("\n").map(line=>line.slice(10)).join("\n"));
const script=blocks.find(block=>block.includes("selective migration inventory"));
assert.ok(script,"apply script");
const start=script.indexOf('if [ "$status" = "success" ]; then\n  stage_root=');
const end=script.indexOf('if [ "$status" = "success" ]; then\n  supabase --workdir');
assert.ok(start>=0&&end>start,"exact inventory segment");
const dir=fs.mkdtempSync(path.join(os.tmpdir(),"d15e-inventory-"));
try {
  for(const [index,block]of blocks.entries()){
    const file=path.join(dir,"syntax-"+index+".sh");fs.writeFileSync(file,block);execFileSync(process.argv[2],["-n",file],{stdio:"pipe"});
  }
  const proof=path.join(dir,"inventory.sh");
  fs.writeFileSync(proof,'set -euo pipefail\nstatus="success"\nfailure_step=""\n'+script.slice(start,end)+'\nif [ "$status" != "success" ]; then echo "$failure_step"; exit 1; fi\nprintf "%s\\n" "$staged_migrations"\n');
  const run=(scope,migrations)=>execFileSync(process.argv[2],[proof],{encoding:"utf8",env:{...process.env,APPLY_SCOPE:scope,RUNNER_TEMP:dir.replaceAll("\\","/"),SUPABASE_MIGRATIONS_DIR:migrations.replaceAll("\\","/")}});
  const source=path.resolve("supabase/migrations");
  const migration="20261112162500_d15e_official_text_niche.sql";
  const staged=run("d15e_niche_only",source).trim().split("\n");
  assert.equal(staged.length,71);assert.ok(staged.includes(migration));assert.ok(!staged.some(name=>name.includes("_e10_10_")));
  const memory=run("d15e_memory_only",source).trim().split("\n");
  assert.equal(memory.length,72);assert.ok(memory.includes("20261113111515_d15e_transversal_memory.sql"));assert.ok(memory.includes(migration));assert.ok(!memory.some(name=>name.includes("_e10_10_")));
  assert.ok(!staged.includes("20261113111515_d15e_transversal_memory.sql"));
  const legacy=run("d14d_niche_only",source).trim().split("\n");
  assert.equal(legacy.length,70);assert.ok(!legacy.includes(migration));
  const unexpected=path.join(dir,"unexpected");fs.mkdirSync(unexpected);
  for(const name of fs.readdirSync(source))if(name.endsWith(".sql"))fs.copyFileSync(path.join(source,name),path.join(unexpected,name));
  fs.writeFileSync(path.join(unexpected,"20261113000000_unapproved.sql"),"-- unapproved proof fixture");
  assert.throws(()=>run("d15e_niche_only",unexpected),/Command failed/);
  console.log("PASS Bash syntax, D15E memory72, textual71 and legacy70 selective inventories preserved, E10.10 exclusion and unexpected migration fail-closed; no Supabase/network calls");
} finally {
  const resolved=path.resolve(dir),prefix=path.resolve(os.tmpdir())+path.sep+"d15e-inventory-";
  assert.ok(resolved.startsWith(prefix));fs.rmSync(resolved,{recursive:true,force:true});
}
