import { useEffect, useState } from 'react';
import {
  ProductModel,
  CartModel,
  type ICartItem,
  type IProduct,
  type ICart,
  UserModel,
} from './models';
import './App.css';

interface CartItem extends ICartItem {
  product: IProduct;
}

function App() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cart, setCart] = useState<InstanceType<typeof CartModel> | null>(null);

  useEffect(() => {
    // Initialize some sample products
    const initProducts = async () => {
      const existing = await ProductModel.find();
      if (existing.length === 0) {
        await ProductModel.insertMany([
          {
            _id: '1',
            name: 'Laptop',
            price: 999,
            description: 'High performance laptop',
          },
          { _id: '2', name: 'Mouse', price: 25, description: 'Wireless mouse' },
          {
            _id: '3',
            name: 'Keyboard',
            price: 75,
            description: 'Mechanical keyboard',
          },
        ]);
      }
      const prods = await ProductModel.find();
      setProducts(prods);
    };
    initProducts();

    // Load cart
    const loadCart = async () => {
      const carts = await CartModel.findById('1').populate('_id');
      if (carts) {
        setCart(carts);
      } else {
        const cart = new CartModel({
          _id: '1',
          total: 100,
        });
        const user = new UserModel({
          id: '1',
          name: 'Santhosh',
        });
        cart
          .save()
          .then(() => {
            return user.save();
          })
          .then(() => {
            setCart(cart);
          });
      }
    };
    loadCart();
  }, []);

  const addToCart = (product: IProduct) => {
    if (!cart) return;
    const cartItem = cart.items.find((i) => {
      if (typeof i === 'string') {
        return i === '6';
      }
      return i._id === '6';
    });
    if (!cartItem) {
      cart.items.push({
        _id: '6',
        description: 'description',
        name: 'name',
        price: 100,
      });
    } else if (typeof cartItem !== 'string') {
      cartItem.name = 'adfasdf';
    }
    // cart.items = [];
    // cart.items.push({
    //   _id: '4',
    //   description: 'description',
    //   name: 'name',
    //   price: 100,
    // });
    cart.save();
    // if (existingItem) {
    //   newCart = cart.map((item) =>
    //     item.product._id === product._id
    //       ? { ...item, quantity: item.quantity + 1 }
    //       : item
    //   );
    // } else {
    //   newCart = [...cart, { product, quantity: 1 }];
    // }
    // setCart(newCart);
    // // Save to DB
    // const cartDoc = {
    //   _id: 'cart1',
    //   items: newCart.map((item) => ({
    //     product: item.product._id,
    //     quantity: item.quantity,
    //   })),
    //   total: calculateTotal(newCart),
    // };
    // await CartModel.replaceOne(cartDoc);
  };

  const calculateTotal = (items: CartItem[]) => {
    return items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
  };

  return (
    <div className="app">
      <h1>
        Shopping Cart App:{' '}
        {typeof cart?._id === 'string' ? 'NO id' : cart?._id.name}
      </h1>
      <div className="products">
        <h2>Products</h2>
        {products.map((product) => (
          <div key={product._id} className="product">
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p>${product.price}</p>
            <button onClick={() => addToCart(product)}>Add to Cart</button>
          </div>
        ))}
      </div>
      <div className="cart">
        <h2>Cart</h2>
        {cartItems.map((item) => (
          <div key={item.product._id} className="cart-item">
            <span>
              {item.product.name} x {item.quantity}
            </span>
            <span>${item.product.price * item.quantity}</span>
          </div>
        ))}
        {/* <p>Total: ${calculateTotal(cart)}</p> */}
        <button>Checkout</button>
      </div>
      <div className="orders">
        {/* <h2>Orders</h2>
        {orders.map((order) => (
          <div key={order._id} className="order">
            <h3>Order {order._id}</h3>
            <p>Status: {order.status}</p>
            <p>Total: ${order.total}</p>
            <ul>
              {order.items.map((item: any, idx: number) => (
                <li key={idx}>
                  {item.product.name} x {item.quantity} @ ${item.price}
                </li>
              ))}
            </ul>
          </div>
        ))} */}
      </div>
    </div>
  );
}

export default App;
