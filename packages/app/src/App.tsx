import { useEffect, useState } from 'react';
import './App.css';

import { Schema, model } from 'iodm';

interface ITodo {
  _id: number;
  title: string;
  content: string;
}

interface IUser {
  _id: number;
  name: string;
}

const todoSchema = new Schema<ITodo>({
  _id: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: String,
});

const userSchema = new Schema<IUser>({
  _id: Number,
  name: String,
});

const UserModel = model('User', userSchema);

function App() {
  const [idb, setIdb] = useState<IDBDatabase | null>(null);

  useEffect(() => {
    const openReq = window.indexedDB.open('test-db', 1);

    openReq.onupgradeneeded = (ev) => {
      if (!ev.target || !('result' in ev.target)) return;

      const db = ev.target.result as IDBDatabase;

      const store = db.createObjectStore('User', {
        keyPath: '_id',
      });

      for (let i = 1; i < 3; ++i) {
        store.add({
          _id: i,
          name: 'user ' + i,
        });
      }
    };

    openReq.onsuccess = (ev) => {
      if (!ev.target || !('result' in ev.target)) return;

      setIdb(ev.target.result as IDBDatabase);
      UserModel._db = ev.target.result as IDBDatabase;
    };

    openReq.onerror = (ev) => console.error('idb error', ev);
  }, []);

  return (
    <>
      <div>
        <button
          onClick={async () => {
            if (!idb) return;

            UserModel.find();

            const user = new UserModel({
              _id: 1,
              name: 'Batman',
            });

            console.log('user.validate()', user.validate());
            console.log('user.validate()', JSON.parse(JSON.stringify(user)));
          }}
        >
          find
        </button>
      </div>
    </>
  );
}

export default App;
