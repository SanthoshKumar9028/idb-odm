import { model } from './model';
import { Schema } from './schema';

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
  age: Number,
  name: String,
});

const UserModel = model('name', userSchema);

UserModel.find().then(docs => {
  docs[0]
})

const a = new UserModel();

a.validate();
