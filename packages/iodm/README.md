# iodm

`iodm` is an Object Data Modeling library for IndexedDB. It provides a schema-driven API for defining models, validating document shapes, and using IndexedDB as a persistent storage backend in browser applications.

## Features

- Schema-based model definition with primitives, arrays, references, dates, sets, maps, and virtuals
- IndexedDB initialization utility with upgrade hooks
- Model methods for insert, update, delete, find, and query operations
- Plugin support for schema extensions and behaviors
- Type-safe model definitions with TypeScript support

## Install

```bash
npm install iodm
```

## Quick Start with React

```tsx
import React, { useEffect } from 'react';
import iodm, { Schema, configureIDB } from 'iodm';

interface User {
  name?: string;
  email: string;
  age?: number;
  isActive?: boolean;
  createdAt?: Date;
}

const userSchema = new Schema<User>({
  name: String,
  email: { type: String, required: true },
  age: { type: Number, min: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: Date,
});

const UserModel = iodm.model('User', userSchema);

const configurePromise = configureIDB({
  db: 'MyAppDB',
  version: 1,
  models: [UserModel],
});

configurePromise.then(() => {
  createRoot(document.getElementById('root')!).render(<App />);
}).catch(() => {
    createRoot(document.getElementById('root')!).render(<div>Error initializing database</div>);
});
```

## Quick Start with TypeScript

```ts
import iodm, { Schema, configureIDB } from 'iodm';

interface User {
  name?: string;
  email: string;
  age?: number;
  isActive?: boolean;
  createdAt?: Date;
}

const userSchema = new Schema<User>({
  name: String,
  email: { type: String, required: true },
  age: { type: Number, min: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: Date,
});

const UserModel = iodm.model('User', userSchema);

async function main() {
  await configureIDB({
    db: 'MyAppDB',
    version: 1,
    models: [UserModel],
  });

  const newUser = await UserModel.insertOne({
    name: 'Alice',
    email: 'alice@example.com',
    age: 28,
  });

  console.log('Created user:', newUser);

  const users = await UserModel.find({ isActive: true });
  console.log('Active users:', users);

  await UserModel.updateOne({ _id: newUser._id }, { age: 29 });
  await UserModel.deleteOne({ _id: newUser._id });
}

main().catch(console.error);
```

## Model Definition

Use `new Schema()` to define the structure of your documents. Primitive fields can be specified directly, or with a configuration object for validation and default values.

```ts
const productSchema = new Schema({
  title: { type: String, required: true },
  price: { type: Number, min: 0 },
  tags: [String],
  publishedAt: Date,
});
```

## Database Configuration

`configureIDB()` opens the browser IndexedDB database and initializes each model. Call it before using your models in the app.

```ts
import { configureIDB } from 'iodm';

await configureIDB({
  db: 'MyAppDB',
  version: 1,
  models: [UserModel],
});
```

Optional hooks `onUpgradeNeededPre` and `onUpgradeNeededPost` can be supplied to run logic during database upgrades.

## API

### Exports

- `default` / `Iodm` — default ODM instance for creating models and registering plugins
- `Schema` — schema constructor for defining model structures
- `configureIDB` — IndexedDB setup helper
- `AbstractModel`, `AbstractModelClass` — base classes for advanced model use

## Documentation

Github [Documentation link](https://github.com/SanthoshKumar9028/idb-odm/blob/main/packages/iodm/docs/pages/iodm.md) for detailed API docs and advanced examples.