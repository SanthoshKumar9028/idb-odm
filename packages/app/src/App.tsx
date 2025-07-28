import { useEffect, useState } from 'react';
import './App.css';

import { Query } from 'iodm-query';

interface IPost {
  id: string;
  title: string;
  content: string;
}

function App() {
  const [count, setCount] = useState(0);
  const [query, setQuery] = useState<Query<IPost> | null>(null);

  useEffect(() => {
    const openReq = window.indexedDB.open('test-db', 1);

    openReq.onupgradeneeded = (ev) => {
      if (!ev.target || !('result' in ev.target)) return;

      const db = ev.target.result as IDBDatabase;

      const store = db.createObjectStore('posts', {
        keyPath: 'id',
      });

      store.add({ id: '1', title: 'awsome title', content: 'awsome content' });
      store.add({ id: '2', title: 'awsome title', content: 'awsome content' });
    };

    openReq.onsuccess = (ev) => {
      if (!ev.target || !('result' in ev.target)) return;

      setQuery(new Query<IPost>(ev.target.result as IDBDatabase, 'posts'));
    };

    openReq.onerror = (ev) => console.error('idb error', ev);
  }, []);

  return (
    <>
      <div>
        <button
          onClick={async () => {
            if (!query) return;

            const post = await query.find({$query: IDBKeyRange.lowerBound("2")});
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
