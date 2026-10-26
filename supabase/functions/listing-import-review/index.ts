import {createReviewHandler} from './handler.mjs';
Deno.serve(createReviewHandler({env:(name:string)=>Deno.env.get(name)}));
