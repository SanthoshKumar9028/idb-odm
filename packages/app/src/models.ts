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

  schema.post(['find', 'findById'], function (docs) {
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

interface IUser {
  _id: number;
  name: string;
  fullname: string;
  age: number;
  address: number | IAddress;
  // visited: IAddress[];
}

interface InstanceMethods {
  printFullName: () => void;
  printGreetings: (msg: string) => void;
}

interface StaticsMethods {
  getCount(): Promise<number>;
}

const userSchema = new Schema<IUser, InstanceMethods, StaticsMethods>({
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
  schema.pre('find', function (value, options) {
    console.log('plugin > pre find user', { value, options });
    return { value: 'value from previous hook' };
  });

  schema.pre('find', function (value, options) {
    console.log('plugin > pre find user', { value, options });
  });

  schema.post('find', function (value, options) {
    console.log('plugin > post find user', { value, options });
    value.forEach((doc: IUser) => {
      doc.name = doc.name.toUpperCase();
    });
  });
});

userSchema.pre('save', function (value, options) {
  console.log('pre save user', { value, options });
});

userSchema.post('save', function (doc, options) {
  console.log('post save user', { doc, options });
});

userSchema.methods.printFullName = function () {
  console.log('fullname:', this.fullname);
};

userSchema.methods.printGreetings = function (msg = 'Hello') {
  console.log(msg, this.name);
};

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

// const TodoModel = model('Todo', todoSchema);
export const AddressModel = iodm.model('Address', addressSchema);
export const UserModel = iodm.model('User', userSchema);
