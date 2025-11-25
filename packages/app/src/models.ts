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
export const AddressModel = model('Address', addressSchema);
export const UserModel = model('User', userSchema);
