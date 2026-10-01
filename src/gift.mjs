import {countries,projects,moods,needs} from './gift-data.mjs';
import {initialSimulation,restoreSimulation,localCurrency} from './simulations.mjs';
export const GIFT_DRAFT='sokile-gift-draft-v1';
export function cleanGift(raw){
 const p=projects.find(p=>p.id===raw?.project);
 if(!p||!countries.includes(raw?.country)||!moods.some(m=>m.id===raw?.mood)||!needs[p.mode].some(n=>n.id===raw?.need))return null;
 return {project:p.id,country:raw.country,mood:raw.mood,need:raw.need};
}
export function giftTools(answers){return answers.project==='land'?['construction','purchase','savings']:answers.project.startsWith('rent')?['savings']:['purchase','savings'];}
export function giftSimulation(answers,raw){
 const restored=restoreSimulation(JSON.stringify(raw));
 const next=restored||{...initialSimulation(),country:answers.country.replace('’',"'"),currency:localCurrency(answers.country)};
 if(!restored||!giftTools(answers).includes(next.active))next.active=giftTools(answers)[0];
 return next;
}
export function giftApi(url,key,fetcher=fetch){
 async function request(user,method,body){
  if(!user?.id||!user?.token)throw new Error('Connectez-vous pour retrouver votre cadeau.');
  const response=await fetcher(`${url}/rest/v1/gift_projects?${method==='GET'?`user_id=eq.${encodeURIComponent(user.id)}&select=answers,simulation&limit=1`:'on_conflict=user_id'}`,{method,headers:{apikey:key,Authorization:`Bearer ${user.token}`,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=representation'},...(body?{body:JSON.stringify(body)}:{})});
  if(!response.ok)throw new Error(response.status===401?'Votre session a expiré. Reconnectez-vous.':'Votre cadeau n’a pas pu être enregistré ou chargé. Réessayez.');
  return response.json();
 }
 return {load:async user=>(await request(user,'GET'))[0]||null,save:async(user,answers,simulation)=>{
  if(!user?.id||!user?.token)throw new Error('Connectez-vous pour retrouver votre cadeau.');
  const clean=cleanGift(answers);if(!clean)throw new Error('Complétez les quatre questions.');
  return (await request(user,'POST',{user_id:user.id,updated_at:new Date().toISOString(),answers:clean,simulation:giftSimulation(clean,simulation)}))[0];
 }};
}
export async function downloadBoard(answers){
 const p=projects.find(p=>p.id===answers.project),m=moods.find(m=>m.id===answers.mood);
 const image=new Image();image.src='/gifts/ambiances.webp';await image.decode();
 const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=1450;const ctx=canvas.getContext('2d');
 ctx.fillStyle='#fffdf8';ctx.fillRect(0,0,1200,1450);ctx.fillStyle='#99513c';ctx.font='28px Arial';ctx.fillText('SOKILÉ · MON FUTUR CHEZ-MOI',65,85);
 ctx.fillStyle='#302d28';ctx.font='48px Georgia';ctx.fillText(m.title,65,165);ctx.font='25px Arial';ctx.fillText(`${answers.country} · ${p.tag}`,65,220);
 const col=moods.findIndex(x=>x.id===m.id),row=p.kind==='land'?2:p.kind==='flat'?1:0;
 ctx.drawImage(image,col*image.width/4,row*image.height/3,image.width/4,image.height/3,65,270,1070,802.5);
 m.colors.forEach((color,i)=>{ctx.fillStyle=color;ctx.fillRect(65+i*360,1120,330,65);ctx.fillStyle='#302d28';ctx.font='23px Arial';ctx.fillText(m.materials[i],65+i*360,1220)});
 ctx.fillStyle='#71685d';ctx.font='22px Arial';ctx.fillText('Inspiration générée par IA · Aucun bien disponible représenté.',65,1315);
 ctx.fillText('Un univers à adapter au bien, à votre budget et aux règles locales.',65,1355);
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('Le téléchargement n’a pas pu être préparé.');
 const href=URL.createObjectURL(blob),a=document.createElement('a');a.href=href;a.download='Sokile-mon-futur-chez-moi.png';a.click();setTimeout(()=>URL.revokeObjectURL(href),60000);
}
