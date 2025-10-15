import { useEffect, useState } from 'react';
import './App.css';

import { Schema, model } from 'iodm';

interface IAddress {
  no: number;
  street?: string;
  contact?: string;
}

interface IUser {
  // _id: string;
  title: string;
  content: string;
  address: IAddress;
}

const addressSchema = new Schema<IAddress>({
  no: {
    type: Number,
    required: true,
    min: 100,
  },
  street: String,
  contact: String,
});

const userSchema = new Schema<IUser>({
  title: String,
  content: {
    type: String,
    required: true,
  },
  address: addressSchema,
});

const UserModel = model('User', userSchema);

function App() {
  const [idb, setIdb] = useState<IDBDatabase | null>(null);

  useEffect(() => {
    const openReq = window.indexedDB.open('test-db', 1);

    openReq.onupgradeneeded = (ev) => {
      if (!ev.target || !('result' in ev.target)) return;

      const db = ev.target.result as IDBDatabase;

      const store = db.createObjectStore('posts', {
        keyPath: '_id',
      });

      for (let i = 1; i < 5; ++i) {
        store.add({
          _id: i,
          title: 'awsome title' + i,
          content: 'awsome content',
        });
      }

      // store.add({ _id: '2', title: 'awsome title', content: 'awsome content' });
      // store.add({ _id: '3', title: 'awsome title', content: 'awsome content' });
      // store.add({ _id: '4', title: 'awsome title', content: 'awsome content' });
    };

    openReq.onsuccess = (ev) => {
      if (!ev.target || !('result' in ev.target)) return;

      setIdb(ev.target.result as IDBDatabase);
    };

    openReq.onerror = (ev) => console.error('idb error', ev);
  }, []);

  return (
    <>
      <div>
        <button
          onClick={async () => {
            if (!idb) return;

            const user = new UserModel({
              title: 'Batman',
              content: 'abcd',
              address: {
                no: 123,
                contact: '123',
                street: 'asdf asdf',
              },
            });

            console.log('user.validate()', user.validate());
            console.log('user.validate()', JSON.stringify(user));
          }}
        >
          find
        </button>
      </div>
    </>
  );
}

export default App;
