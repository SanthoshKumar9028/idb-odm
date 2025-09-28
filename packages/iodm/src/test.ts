import { model } from './Model';
import { Schema } from './Schema';

interface TUser {
  name: string;
  age: number;
}

interface TInstanceMethods {
  instanceMethods(): void;
}
interface TStaticMethods {
  staticMethods(): void;
}

const userSchema = new Schema<TUser, TInstanceMethods, TStaticMethods>({
  age: 1,
  name: '',
});

const UserModel = model('name', userSchema);

const a = new UserModel();
