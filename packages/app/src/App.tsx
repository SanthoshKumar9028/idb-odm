import { useEffect, useState } from 'react';
import './App.css';

import { Schema, model } from 'iodm';

interface IAddress {
  _id: number;
  no: number;
  street: string;
}

const addressSchema = new Schema<IAddress>({
  _id: Number,
  no: Number,
  street: String,
});

interface IUser {
  _id: number;
  name: string;
  age: number;
  address: number | IAddress;
  visited: IAddress[];
}

const userSchema = new Schema<IUser>({
  _id: {
    type: Number,
  },
  name: String,
  age: {
    type: Number,
    required: true,
  },
  address: {
    type: Number,
    ref: 'Address',
  },
  visited: [{ type: Number, ref: 'Address', required: true }],
});

// const TodoModel = model('Todo', todoSchema);
const AddressModel = model('Address', addressSchema);
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

      // for (let i = 1; i < 3; ++i) {
      //   store.add({
      //     _id: String(i),
      //     name: 'user ' + i,
      //   });
      // }

      const address = db.createObjectStore('Address', {
        keyPath: '_id',
      });
    };

    openReq.onsuccess = (ev) => {
      if (!ev.target || !('result' in ev.target)) return;

      setIdb(ev.target.result as IDBDatabase);
      UserModel._db = ev.target.result as IDBDatabase;
    };

    openReq.onerror = (ev) => console.error('idb error', ev);
  }, []);

  console.log('idb', idb?.name);

  return (
    <>
      <div>
        <button
          onClick={async () => {
            if (!idb) return;

            UserModel._db = idb;
            AddressModel._db = idb;

            UserModel.find()
              // .populate('address')
              .populate('visited')
              .then(async (res) => {
                console.log('res', res);

                // res[0].address.street = "Old Old Anna Street";
                // if (typeof res[0].address === 'number') {
                // }
                // res[0].visited = [
                //   { _id: 1, no: 10, street: 'visited street 1' },
                //   { _id: 2, no: 20, street: 'visited street 2' },
                //   { _id: 3, no: 30, street: 'visited street 3' },
                // ];

                // res[0].visited.push({
                //   _id: 4,
                //   no: 40,
                //   street: 'something',
                // });

                // res[0].save();

                // if (res[0].address instanceof AddressModel) {
                //   res[0].address.save();
                // } else {
                //   console.error('res[0].address is not a AddressModel instance');
                // }
              });

            // const user = new UserModel({
            //   _id: 1,
            //   name: 'Batman',
            //   age: 30,
            //   address: {
            //     _id: 101,
            //     no: 10,
            //     street: 'Gandhi street',
            //   },
            // });

            // user.save();

            // console.log(UserModel._schema);
            // console.log('user.validate()', JSON.parse(JSON.stringify(user)));
          }}
        >
          find
        </button>
      </div>
    </>
  );
}

export default App;
