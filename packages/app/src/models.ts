import iodm, { Schema } from 'iodm';

function loadedAtPlugin(schema: Schema, options: any) {
  schema
    .virtual('loadedAt')
    .get(function () {
      return this._loadedAt;
    })
    .set(function (v) {
      this._loadedAt = v;
    });

  schema.post(['find', 'findById'], function (_, docs) {
    if (!Array.isArray(docs)) {
      docs = [docs];
    }
    const now = new Date();
    for (const doc of docs) {
      doc.loadedAt = now;
    }
  });
}

// global plugins
iodm.plugin(loadedAtPlugin);

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

addressSchema.plugin((schema) => {
  schema.pre('insertOne', function (err, value, options) {
    console.log('address > plugin > pre insertOne user', {
      err,
      value,
      options,
    });
    return { value: 'value from previous hook' };
  });

  schema.pre('insertOne', function (err, value, options) {
    console.log('address > plugin > pre insertOne user', {
      err,
      value,
      options,
    });
  });

  schema.post('insertOne', function (err, value, options) {
    console.log('address > plugin > post insertOne user', {
      err,
      value,
      options,
    });
  });
});

addressSchema.pre('save', function (err, value, options) {
  console.log('address > pre save user', { err, value, options });
});

addressSchema.post('save', function (err, doc, options) {
  console.log('address > post save user', { err, doc, options });
});

addressSchema.enableBroadcastFor('find', {
  type: 'pre',
  prepare(p) {
    return JSON.stringify(p);
  },
});
addressSchema.broadcastHook((err, res) => {
  console.log('addressSchema', err, res);
});

interface IUser {
  _id: number;
  name: string;
  age: number;
  address: number | IAddress;
  // visited: IAddress[];
}
interface IUserVirtual {
  fullname: string;
}

interface InstanceMethods {
  printFullName: () => void;
  printGreetings: (msg?: string) => void;
}

interface StaticsMethods {
  getCount(): Promise<number>;
}

const userSchema = new Schema<
  IUser,
  InstanceMethods,
  IUserVirtual,
  StaticsMethods
>({
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
  // visited: [{ type: Number, ref: 'Address', required: true }],
});

userSchema.plugin((schema) => {
  schema.pre('insertOne', function (err, value, options) {
    console.log('user > plugin > pre insertOne user', { err, value, options });
    return { value: 'value from previous hook' };
  });

  schema.pre('insertOne', function (err, value, options) {
    console.log('user > plugin > pre insertOne user', { err, value, options });
  });

  schema.post('insertOne', function (err, value, options) {
    console.log('user > plugin > post insertOne user', { err, value, options });
  });
});

userSchema.pre('save', function (err, value, options) {
  console.log('user > pre save user', { err, value, options });
});

userSchema.post('save', function (err, doc, options) {
  console.log('user > post save user', { err, doc, options });
});

userSchema.methods.printFullName = function () {
  console.log('fullname:', this.fullname);
};

// userSchema.methods.printGreetings = function (msg = 'Hello') {
//   console.log(msg, this.name);
// };

userSchema.method('printGreetings', function (msg = 'Hello') {
  console.log(msg, this.name);
});

userSchema.statics.getCount = async function () {
  const res = await this.find();
  return res.length;
};

userSchema
  .virtual('fullname')
  .get(function (value) {
    // console.log('value', value);

    return `${this.age} ${this.name}`;
  })
  .get(function (value) {
    // console.log('value', value);

    return this.name;
  })
  .get(function (value) {
    // console.log('value', value);

    return this.name;
  })
  .set(function (fullname: string) {
    this.age = Number(fullname.split(' ')[0]);
    this.name = fullname.split(' ')[1];
  });

userSchema.enableBroadcastFor('find', {
  type: 'post',
  prepare(p) {
    return JSON.stringify(p);
  },
});

userSchema.broadcastHook(function (res) {
  console.log('userSchema', res);
});

// const TodoModel = model('Todo', todoSchema);
export const AddressModel = iodm.model('Address', addressSchema);
export const UserModel = iodm.model('User', userSchema);
