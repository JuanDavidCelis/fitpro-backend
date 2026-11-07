import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import express from 'express';

const server = express();

let app: any;

export default async function handler(req: any, res: any) {
  if (!app) {
    try {
      app = await NestFactory.create(AppModule, new ExpressAdapter(server));

      const allowedOrigin = process.env.CLIENT_ORIGIN || '*';
      app.enableCors({ origin: allowedOrigin });

      await app.init();
    } catch (err) {
      app = null;
      throw err;
    }
  }

  return server(req, res);
}
