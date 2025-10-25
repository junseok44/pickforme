import mongoose from 'mongoose';

import User from './user';
import Session from './session';
import Request from './request';
import Chat from './chat';
import Product from './product';
import Purchase from './purchase';
import Event from './event';
import Notice from './notice';
import Notification from './notification';
import DiscoverSection from './discoverSection';
import Log from './log';
import Item from './item';
import Popup from './popup';
import SearchLog from './searchLog';

import { log } from 'utils/logger';
import PurchaseFailure from './purchase/failure';

const uri = process.env.MONGO_URI!;
const isTest = process.env.NODE_ENV === 'test';

if (!isTest) {
  log.debug(`connecting to mongodb`);
  mongoose
    .connect(uri, {
      serverSelectionTimeoutMS: 5000,
    })
    .then(() => {
      log.debug('MongoDB 연결 성공');
    })
    .catch((err) => {
      void log.error('MongoDB 연결 실패', 'SYSTEM', 'HIGH', {
        error: err,
      });
    });
}

const db = {
  User,
  Session,
  Request,
  Chat,
  Product,
  DiscoverSection,
  Purchase,
  Event,
  Notice,
  Notification,
  Log,
  Item,
  Popup,
  PurchaseFailure,
  SearchLog,
};

export default db;
