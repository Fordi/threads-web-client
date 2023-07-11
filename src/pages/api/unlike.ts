import { NextApiRequest, NextApiResponse } from "next";
import { Client } from '@threadsjs/threads.js';
import * as fs from 'fs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token, post_id } = req.body;
  
  let payload: any = {};

  if (fs.existsSync('./unlike.json')) {
    console.log('sent test like');
    payload = JSON.parse(fs.readFileSync('./unlike.json', 'utf8'));
  }
  else {
    try {
      const client = new Client({ token });
      let user = "1";
      payload = await client.rest.request(`/api/v1/media/${post_id}_${String(user)}/like/`, {
        method: "POST",
      });
    } catch (e: any) {
      payload['error'] = e.message;
    }
  }

  return res.status(200).json(payload);
}