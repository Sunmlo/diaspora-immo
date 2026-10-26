import {load} from 'cheerio';
import {createHash} from 'node:crypto';
const clean=v=>typeof v==='string'?v.replace(/\s+/g,' ').trim():'';
const countries={'SN':'Sénégal','CI':"Côte d'Ivoire",'CM':'Cameroun','CG':'Congo','GA':'Gabon','BJ':'Bénin','BF':'Burkina Faso','ML':'Mali','NE':'Niger','TG':'Togo','CF':'Centrafrique','TD':'Tchad'};
function absolute(v,base){try{const u=new URL(v,base);if(u.protocol==='https:'&&!u.username&&!u.password){u.hash='';return u.href;}}catch{}return '';}
function flatten(v,out=[]){if(Array.isArray(v))v.forEach(x=>flatten(x,out));else if(v&&typeof v==='object'){out.push(v);for(const k of ['@graph','mainEntity','itemListElement','item','itemOffered'])if(v[k])flatten(v[k],out);}return out;}
export function extractPage(html,url){
 const $=load(html),nodes=[];
 $('script[type="application/ld+json"]').each((_,el)=>{try{flatten(JSON.parse($(el).text()),nodes);}catch{}});
 const types=n=>[].concat(n?.['@type']||[]);
 const isProperty=n=>types(n).some(t=>/^(Apartment|House|SingleFamilyResidence|Residence|Accommodation|RealEstateListing|Product)$/.test(t));
 const entity=nodes.find(isProperty)||{},offer=[].concat(entity.offers||[])[0]||{};
 const home=entity.mainEntity||entity.about||entity.itemOffered||entity;
 const address=home.address||entity.address||{};
 const title=clean(entity.name)||clean($('h1').first().text())||clean($('meta[property="og:title"]').attr('content'));
 let description=clean(entity.description)||clean($('.property-description,.property-description-wrap,.description-content,[itemprop="description"],#description').first().text())||clean($('meta[name="description"]').attr('content'));
 const main=$('main,article,.property-detail,.property-details').first();
 const text=clean((main.length?main:$('body')).clone().find('script,style,nav,footer,header').remove().end().text());
 if(!description&&main.length)description=text.slice(0,10000);
 const context=title+' '+description;
 const transaction=/\b(louer|location|rent)\b/i.test(context)?'location':/\b(vendre|vente|sale)\b/i.test(context)?'vente':'';
 const nature=/appartement|apartment/i.test(context)?'appartement':/villa|maison|house/i.test(context)?'maison':/terrain.*agricole/i.test(context)?'agricole':/terrain|parcelle/i.test(context)?'terrain':'';
 const priceText=clean($('.property-price,.item-price,[itemprop="price"],.price').first().text())||text;
 const priceMatch=priceText.match(/(\d[\d\s.,]*?)\s*(?:FCFA|F\s*CFA|XOF|XAF)\b/i);
 let price='';if(['XOF','XAF'].includes(offer.priceCurrency)&&Number(offer.price)>0)price=String(offer.price);else if(priceMatch)price=priceMatch[1].replace(/[\s.,]/g,'');
 const rawCountry=typeof address.addressCountry==='object'?address.addressCountry.name:address.addressCountry;
 const country=countries[rawCountry]||Object.values(countries).find(c=>clean(rawCountry).toLowerCase()===c.toLowerCase())||Object.values(countries).find(c=>context.toLowerCase().includes(c.toLowerCase()))||'';
 const images=[];const add=v=>{if(typeof v==='object')v=v?.url||v?.contentUrl;if(typeof v!=='string')return;const u=absolute(v,url);if(u&&!/logo|favicon|avatar|icon|placeholder/i.test(u)&&!images.includes(u))images.push(u);};
 [].concat(home.image||entity.image||[]).forEach(add);
 $('[property="og:image"]').each((_,e)=>add($(e).attr('content')));
 $('.property-gallery img,.property-slider img,.gallery img,.property-detail img,.property-details img,[data-fancybox] img').each((_,e)=>add($(e).attr('data-src')||$(e).attr('src')));
 const count=(key,pattern)=>String(home[key]?.value??home[key]??text.match(pattern)?.[1]??'');
 const data={reference:'WEB-'+createHash('sha256').update(url).digest('hex').slice(0,20),titre:title.slice(0,200),description:description.slice(0,10000),transaction,nature,pays:country,ville:clean(address.addressLocality)||clean($('[itemprop=addressLocality],.property-city').first().text()),quartier:'',prix_fcfa:price,surface_m2:String(home.floorSize?.value||text.match(/(\d[\d ]*)\s*m[²2]/)?.[1]?.replace(/ /g,'')||''),pieces:count('numberOfRooms',/(\d+)\s*pièces?/i),chambres:count('numberOfBedrooms',/(\d+)\s*chambres?/i),sdb:count('numberOfBathroomsTotal',/(\d+)\s*salles? de bain/i)};
 const links=[];const addLink=(href,label)=>{const u=absolute(href,url);if(u&&new URL(u).hostname===new URL(url).hostname&&u!==url&&!links.some(l=>l.url===u))links.push({url:u,title:clean(label).slice(0,160)||u});};
 for(const n of nodes){if(types(n).includes('ListItem'))addLink(n.url||n.item?.url,n.name||n.item?.name);}
 $('a[href]').each((_,e)=>{const a=$(e),h=a.attr('href'),label=a.text();if(/\/(property|properties|bien|biens|annonce|annonces|listing|propriete|immobilier)\/[^/?#]+/i.test(h)||a.closest('.property-item,.property-card,.item-listing-wrap,.listing-item').length)addLink(h,label);});
 // A catalogue's first card is never treated as the current property.
 const detail=Boolean(isProperty(entity)&&!nodes.some(n=>types(n).includes('ItemList')))||Boolean(transaction&&title&&price&&links.length<3);
 return {data,remotePhotos:images.slice(0,20),sourceUrl:url,isDetail:detail,links:links.slice(0,50),hasMore:links.length>50};
}
