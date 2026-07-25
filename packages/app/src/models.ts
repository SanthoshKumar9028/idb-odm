import iodm, { Schema } from 'iodm';

export interface IAssert {
  _id: string;
  url: string;
  alt?: string;
}

const assertSchema = new Schema<IAssert>({
  url: { type: String, required: true },
  alt: String,
});

export const AssertModel = iodm.model('Assert', assertSchema);

// Shopping Cart Models
export interface IProduct {
  _id: string;
  name: string;
  price: number;
  description: string;
  image?: string;
}

const productSchema = new Schema<IProduct>(
  {
    _id: String,
    name: String,
    price: { type: Number, min: 0 },
    description: String,
    image: String,
  },
  { timestamps: true }
);

export const ProductModel = iodm.model('Product', productSchema);

export interface IUser {
  id: string;
  name: string;
}

const userSchema = new Schema<IUser>(
  {
    id: String,
    name: {
      type: String,
      required: true,
      enum: {
        values: ['Santhosh', 'two'],
        message: '{KEY} shuld be one of enum',
      },
    },
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
    product: { type: String, ref: 'Product' },
    quantity: { type: Number, min: 1, default: 1 },
  },
  { keyPath: 'product' }
);

export interface ICart {
  _id: string | IUser;
  items: ICartItem[];
  total: number;
}

const cartSchema = new Schema<ICart>({
  _id: { type: String, ref: 'User' },
  items: [cartItemSchema],
  total: { type: Number, default: 0 },
});

export const CartModel = iodm.model('Cart', cartSchema);
