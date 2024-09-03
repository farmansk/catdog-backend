import { Keypair, PublicKey } from '@solana/web3.js';
import { Client } from "twitter-api-sdk";
import dotenv from 'dotenv';
dotenv.config();

export const MINT = new PublicKey('CDTr45jQvpSGWyARx28qYtrHAD7cuVVG92Myf2XtM9RR');
export const DECIMALS = 6;

export const wallet = { windows: Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.KEYPAIR))) };

export const tokens = {
    usdc: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    usdt: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    slerf: '7BgBvyjrZX1YKz4oh9mjb8ZScatkkwb8DzFx7LoiVkM3',
    bome: 'ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82',
    wif: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
    maneki: '25hAyBQfoDhfWx9ay6rarbgvWGwDdNqcHsXS3jQ3mTDJ',
    mew: 'MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5',
    popcat: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
    boden: '3psH1Mj1f7yUfaD5gh6Zj7epE8hhrMkMETgv5TshQA4o',
}

export async function getTwitterData(user) {
    const client = new Client(process.env.BEARER_TOKEN);
  
    const response = await client.users.findUserByUsername(user, {
      "expansions": [
          "most_recent_tweet_id"
      ],
    });
    
    return response;
  }