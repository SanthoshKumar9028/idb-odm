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

      store.add({ _id: '1', title: 'awsome title', content: 'awsome content' });
      store.add({ _id: '2', title: 'awsome title', content: 'awsome content' });
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

            const post = await new Query<string | undefined, IPost>(
              idb,
              'posts'
            ).replaceOne({
              _id: '123',
              content: 'update replaceOne',
              title: 'update replaceOne',
            });
            console.log('then data', post);
          }}
        >
          find
        </button>
      </div>
    </>
  );
}

export default App;
