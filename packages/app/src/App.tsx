import { useEffect, useMemo, useState } from 'react';
import {
  ProductModel,
  CartModel,
  type ICartItem,
  type IProduct,
  UserModel,
} from './models';
import './App.css';

interface CartItem extends ICartItem {
  product: IProduct;
}

const sampleProducts: IProduct[] = [
  {
    _id: '1',
    name: 'Laptop Pro',
    price: 999,
    description: 'Slim profile, long battery life, and powerful performance.',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
  },
  {
    _id: '2',
    name: 'Wireless Mouse',
    price: 25,
    description: 'Smooth tracking with ergonomic comfort for all-day use.',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
  },
  {
    _id: '3',
    name: 'Mechanical Keyboard',
    price: 75,
    description: 'Tactile switches and durable frame for fast typing.',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
  },
];

function App() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cart, setCart] = useState<InstanceType<typeof CartModel> | null>(null);
  const [orderMessage, setOrderMessage] = useState('');

  const cartQuantity = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cartItems]
  );

  const buildCartItems = (cartDoc: InstanceType<typeof CartModel>, productList: IProduct[]) => {
    const productMap = new Map(productList.map((product) => [product._id, product]));
    const rawItems = Array.isArray(cartDoc.items) ? cartDoc.items : [];

    return rawItems
      .map((item) => {
        if (!item) return null;

        if (typeof item === 'string') {
          const product = productMap.get(item);
          if (!product) return null;
          return { product, quantity: 1 };
        }

        const productId = typeof item.product === 'string' ? item.product : item.product._id;
        const product =
          productMap.get(productId) ||
          (typeof item.product === 'object' ? item.product : null);
        if (!product) return null;

        return {
          product,
          quantity: item.quantity ?? 1,
        };
      })
      .filter((item): item is CartItem => item !== null);
  };

  const saveCartItems = async (items: CartItem[]) => {
    if (!cart) return;

    cart.items = items.map((item) => ({
      product: item.product._id,
      quantity: item.quantity,
    }));
    cart.total = cartTotal;

    await cart.save();
    setCartItems(items);
    setCart(cart);
  };

  useEffect(() => {
    const initProducts = async () => {
      const existing = await ProductModel.find();
      if (existing.length === 0) {
        await ProductModel.insertMany(sampleProducts);
      }
      const prods = await ProductModel.find();
      setProducts(prods);
      return prods;
    };

    const initCart = async (productList: IProduct[]) => {
      const existingCart = await CartModel.findById('1');
      if (existingCart) {
        setCart(existingCart);
        setCartItems(buildCartItems(existingCart, productList));
        return;
      }

      const user = new UserModel({ id: '1', name: 'Santhosh' });
      const newCart = new CartModel({ _id: '1', items: [], total: 0 });

      await Promise.all([user.save(), newCart.save()]);
      setCart(newCart);
      setCartItems([]);
    };

    initProducts().then(initCart);
  }, []);

  const updateQuantity = async (productId: string, delta: number) => {
    const updatedItems = cartItems
      .map((item) =>
        item.product._id === productId
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
      .filter((item) => item.quantity > 0);

    await saveCartItems(updatedItems);
  };

  const removeFromCart = async (productId: string) => {
    const updatedItems = cartItems.filter((item) => item.product._id !== productId);
    await saveCartItems(updatedItems);
  };

  const addToCart = async (product: IProduct) => {
    if (!cart) return;

    const existingItem = cartItems.find((item) => item.product._id === product._id);
    const updatedItems = existingItem
      ? cartItems.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      : [...cartItems, { product, quantity: 1 }];

    await saveCartItems(updatedItems);
    setOrderMessage('');
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0 || !cart) return;

    await saveCartItems([]);
    setOrderMessage(`Order confirmed! You purchased ${cartQuantity} item(s) for $${cartTotal}.`);
  };

  return (
    <div className="app">
      <header className="hero">
        <div>
          <span className="eyebrow">Modern shopping experience</span>
          <h1>Shopping cart with fast actions</h1>
          <p>Browse products, update quantities, and complete checkout with a clean, responsive interface.</p>
        </div>
        <div className="summary-card">
          <p className="summary-label">Current Cart</p>
          <strong>{cartQuantity} item{cartQuantity === 1 ? '' : 's'}</strong>
          <p>${cartTotal.toFixed(2)}</p>
          <button className="primary" onClick={handleCheckout} disabled={cartItems.length === 0}>
            Checkout
          </button>
        </div>
      </header>

      {orderMessage ? <div className="notice success">{orderMessage}</div> : null}

      <section className="product-grid">
        {products.map((product) => (
          <article key={product._id} className="product-card">
            <img src={product.image} alt={product.name} />
            <div className="product-content">
              <div>
                <h2>{product.name}</h2>
                <p>{product.description}</p>
              </div>
              <div className="product-footer">
                <span className="price">${product.price}</span>
                <button className="secondary" onClick={() => addToCart(product)}>
                  Add to cart
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="cart-panel">
        <div className="cart-header">
          <div>
            <h2>Your Cart</h2>
            <p>Manage your items before checkout.</p>
          </div>
          <span className="tag">{cartQuantity} items</span>
        </div>

        {cartItems.length === 0 ? (
          <div className="empty-state">Your cart is empty. Add products to get started.</div>
        ) : (
          <div className="cart-list">
            {cartItems.map((item) => (
              <div key={item.product._id} className="cart-item">
                <div className="item-info">
                  <strong>{item.product.name}</strong>
                  <span>{item.product.description}</span>
                </div>
                <div className="item-actions">
                  <div className="quantity-controller">
                    <button onClick={() => updateQuantity(item.product._id, -1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product._id, 1)}>+</button>
                  </div>
                  <div className="price-row">
                    <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                    <button className="text-button" onClick={() => removeFromCart(item.product._id)}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="checkout-bar">
          <div>
            <span>Subtotal</span>
            <strong>${cartTotal.toFixed(2)}</strong>
          </div>
          <button className="primary" onClick={handleCheckout} disabled={cartItems.length === 0}>
            Checkout now
          </button>
        </div>
      </section>
    </div>
  );
}

export default App;
