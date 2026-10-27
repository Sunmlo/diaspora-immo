import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer} from 'vite';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {COUNTRY_ONLY_SEARCH,filterPropertiesByCountry} from '../src/property-search.mjs';

const properties=Object.freeze([
  {id:1,country:'Sénégal',city:'Dakar',agency_name:'Locadakar',transaction:'location'},
  {id:2,country:'Sénégal',city:'Nguerigne',agency_name:'Locadakar',transaction:'vente'},
  {id:3,country:'Cameroun',city:'Douala',agency_name:'Sénégal Immobilier',transaction:'vente'},
]);

test('launch mode uses only exact property country, never agency names or cities',()=>{
  assert.equal(COUNTRY_ONLY_SEARCH,true);
  assert.deepEqual(filterPropertiesByCountry(properties,'Sénégal').map(p=>p.id),[1,2]);
  assert.deepEqual(filterPropertiesByCountry(properties,'Cameroun').map(p=>p.id),[3]);
  assert.deepEqual(filterPropertiesByCountry(properties,'Dakar'),[]);
});

test('all countries restores every listing and empty countries give an empty result',()=>{
  assert.deepEqual(filterPropertiesByCountry(properties),properties);
  assert.notEqual(filterPropertiesByCountry(properties),properties);
  assert.deepEqual(filterPropertiesByCountry(properties,'Togo'),[]);
  assert.deepEqual(filterPropertiesByCountry([], 'Sénégal'),[]);
});

test('country selector includes empty countries and is labelled and reversible',async()=>{
  const server=await createServer({server:{middlewareMode:true},appType:'custom'});
  try{
    const {CountryFilter}=await server.ssrLoadModule('/src/country-filter.jsx');
    const countries=[{name:'Sénégal'},{name:'Cameroun'},{name:'Togo'}];
    for(const id of ['home-country','listings-country']){
      const html=renderToStaticMarkup(createElement(CountryFilter,{id,countries,value:'Sénégal',onChange:()=>{}}));
      assert.match(html,new RegExp(`<label for="${id}">Pays</label>`));
      assert.equal((html.match(/<select /g)||[]).length,1);
      assert.equal((html.match(/<option /g)||[]).length,4);
      assert.match(html,/<option value="Tous">Tous les pays<\/option>/);
      assert.match(html,/<option value="Sénégal" selected="">Sénégal<\/option>/);
      assert.match(html,/<option value="Togo">Togo<\/option>/);
      assert.doesNotMatch(html,/<input|Filtres|Budget|Dakar/);
    }
    const {HomeDiscovery}=await server.ssrLoadModule('/src/home-discovery.jsx');
    const html=renderToStaticMarkup(createElement(HomeDiscovery,{countryOnly:true}));
    assert.match(html,/Voir les biens/);
    assert.match(html,/Programmes neufs/);
    assert.doesNotMatch(html,/Acheter|Louer|Terrains et parcelles/);
  }finally{await server.close();}
});

test('both entry points share the country state and advanced controls cannot filter invisibly',()=>{
  const app=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
  assert.match(app,/COUNTRY_ONLY_SEARCH \? filterPropertiesByCountry\(ALL_PROPS, filterCountry\) : ALL_PROPS.filter/);
  assert.match(app,/country=\{filterCountry\} onCountryChange=\{chooseCountry\}/);
  assert.match(app,/id="listings-country" countries=\{COUNTRIES_ANNONCES\} value=\{filterCountry\} onChange=\{chooseCountry\}/);
  assert.match(app,/chooseCountry = country => \{ resetFilters\(\); setShowFilters\(false\); setFilterCountry\(country\); \}/);
  assert.match(app,/!COUNTRY_ONLY_SEARCH&&showFilters&&/);
});
