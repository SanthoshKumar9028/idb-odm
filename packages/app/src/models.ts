import iodm, { Schema } from 'iodm';

// Shopping Cart Models
export interface IProduct {
  _id: string;
  name: string;
  price: number;
  description: string;
}

const productSchema = new Schema<IProduct>({
  _id: String,
  name: String,
  price: Number,
  description: String,
});

export const ProductModel = iodm.model('Product', productSchema);

export interface IUser {
  id: string;
  name: string;
}

const userSchema = new Schema<IUser>(
  {
    id: String,
    name: String,
  },
  { keyPath: 'id' }
);

export const UserModel = iodm.model('User', userSchema);

export interface ICartItem {
  product: string | IProduct;
  quantity: number;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    product: { type: String, ref: 'Product', required: true },
    quantity: { type: Number, min: 1 },
  },
  { keyPath: 'product' }
);

export interface ICart {
  _id: string | IUser;
  items: Array<IProduct | string>;
  total: number;
}

const cartSchema = new Schema<ICart>({
  _id: { type: String, ref: 'User' },
  items: [{ type: String, ref: 'Product' }],
  total: Number,
});

export const CartModel = iodm.model('Cart', cartSchema);
