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

userSchema.pre('find', function (value, options) {
  console.log('pre find user', { value, options });
  return { value: 'value from previous hook' };
});
userSchema.pre('find', function (value, options) {
  console.log('pre find user', { value, options });
});

userSchema.post('find', function (value, options) {
  console.log('post find user', { value, options });
  value.forEach((doc: IUser) => {
    doc.name = doc.name.toUpperCase();
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
export const AddressModel = model('Address', addressSchema);
export const UserModel = model('User', userSchema);
