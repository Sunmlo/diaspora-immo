import Stripe from 'npm:stripe@22.0.0';
import {createPaymentsHandler} from './handler.mjs';
const cryptoProvider = Stripe.createSubtleCryptoProvider();
Deno.serve(createPaymentsHandler({
 env:(name:string)=>Deno.env.get(name),
 stripeFactory:(key:string)=>{
  const stripe = new Stripe(key,{httpClient:Stripe.createFetchHttpClient(),maxNetworkRetries:1});
  return {
   checkout:stripe.checkout, balance:stripe.balance,
   verifyEvent:(body:string,signature:string,secret:string)=>stripe.webhooks.constructEventAsync(body,signature,secret,undefined,cryptoProvider),
  };
 },
}));
