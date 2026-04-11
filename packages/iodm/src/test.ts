import iodm from './iodm';
import { Schema } from './schema';

interface TUser {
  name: string;
  age: number;
}
interface TUserVirtials {
  fullname: string;
}

interface TInstanceMethods {
  instanceMethods(): void;
}
interface TStaticMethods {
  staticMethods(): void;
}

const userSchema = new Schema<
  TUser,
  TInstanceMethods,
  TUserVirtials,
  TStaticMethods
>({
  age: Number,
  name: String,
});

const UserModel = iodm.model('name', userSchema);

UserModel.find().then((docs: any) => {
  docs[0];
});

const a = new UserModel();

a.validate();
