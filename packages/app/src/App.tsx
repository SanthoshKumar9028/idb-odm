import { useEffect, useState } from 'react';
import './App.css';

import { Query } from 'iodm-query';

interface IPost {
  _id: string;
  title: string;
  content: string;
}

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

            const itr = await new Query<any, IPost>(
              idb,
              'posts'
            ).openCursor({$or: [{_id: 1}, {_id: 4}]});

            for await (const doc of itr) {
              await new Promise((res) => setTimeout(res, 5));
              console.log('doc', doc);
            }
          }}
        >
          find
        </button>
      </div>
    </>
  );
}

export default App;
