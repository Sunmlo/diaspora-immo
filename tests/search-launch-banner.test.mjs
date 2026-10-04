import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

test('launch banner explains limited inventory and keeps the opt-in search link',async()=>{
 const server=await createServer({server:{middlewareMode:true},appType:'custom'});
 try{
  const {SearchRequestBanner}=await server.ssrLoadModule('/src/search-requests.jsx');
  const html=renderToStaticMarkup(createElement(SearchRequestBanner));
  assert.match(html,/aria-labelledby="sr-launch-title"/);
  assert.match(html,/id="sr-launch-title">Sokilé se lance\. Votre recherche compte\./);
  assert.match(html,/Le site est opérationnel, mais les annonces sont encore peu nombreuses/);
  assert.match(html,/progressivement notre réseau d’agences et de propriétaires/);
  assert.match(html,/Avec votre accord, les professionnels vérifiés du pays pourront/);
  assert.match(html,/href="\/recherche">Décrire ma recherche<\/a>/);
  assert.equal((html.match(/<a /g)||[]).length,1);
 }finally{await server.close();}
});
