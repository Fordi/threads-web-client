import { NextApiRequest, NextApiResponse } from "next";
import { Client } from '@threadsjs/threads.js';

import * as fs from 'fs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.body;

  let payload: any = {};

  if (fs.existsSync('./feed.json')) {
    console.log('sent test feed');
    payload = JSON.parse(fs.readFileSync('./feed.json', 'utf8'));
  }
  else {
    try {
      const client = new Client({ token });

      payload = await client.feeds.fetch();
    } catch (e: any) {
      payload['error'] = e.message;
    }
  }

  return res.status(200).json(payload);
}