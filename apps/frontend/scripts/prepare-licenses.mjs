// Conserva avisos de las dependencias distribuidas; no asigna una licencia al proyecto.
import fs from 'node:fs';
import path from 'node:path';
const destination=path.resolve('public/licenses');
fs.rmSync(destination,{recursive:true,force:true});fs.mkdirSync(destination,{recursive:true});
const lock=JSON.parse(fs.readFileSync('package-lock.json','utf8')),manifest=[];
for(const [relative,info] of Object.entries(lock.packages)){
 if(!relative.startsWith('node_modules/')||info.dev||!fs.existsSync(relative))continue;
 const packageFile=path.join(relative,'package.json');if(!fs.existsSync(packageFile))continue;
 const pkg=JSON.parse(fs.readFileSync(packageFile,'utf8'));
 const folder=(pkg.name+'@'+pkg.version).replaceAll('/','__');const notices=[];
 for(const file of fs.readdirSync(relative)){
  const source=path.join(relative,file);
  if(!/^(licen[cs]e|notice|copying)(?:$|[.\-_])/i.test(file)||!fs.statSync(source).isFile())continue;
  const target=path.join(destination,folder,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target);notices.push(folder+'/'+file);
 }
 manifest.push({name:pkg.name,version:pkg.version,license:pkg.license||info.license||'Consultar los avisos del paquete',notices});
}
fs.writeFileSync(path.join(destination,'index.json'),JSON.stringify(manifest,null,2)+'\n');
for(const required of ['jspdf','katex'])if(!manifest.some(p=>p.name===required&&p.notices.length))throw new Error('Falta el aviso de '+required);
console.log(JSON.stringify({dependency_notices:manifest.length}));
