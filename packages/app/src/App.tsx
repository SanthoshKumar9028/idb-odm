import { useEffect } from 'react';
import './App.css';
import { UserModel } from './models';

function App() {
  useEffect(() => {
    UserModel.find()
      .populate('address')
      .then(async (res) => {
        console.log('res', res);
      });
  }, []);

  return (
    <>
      <div>
        <button
          onClick={async () => {
            UserModel.find()
              // .populate('address')
              .populate('visited')
              .then(async (res) => {
                console.log('res', res);

                // res[0].address.street = "Old Old Anna Street";
                // if (typeof res[0].address === 'number') {
                // }
                // res[0].visited = [
                //   { _id: 1, no: 10, street: 'visited street 1' },
                //   { _id: 2, no: 20, street: 'visited street 2' },
                //   { _id: 3, no: 30, street: 'visited street 3' },
                // ];

                // res[0].visited.push({
                //   _id: 4,
                //   no: 40,
                //   street: 'something',
                // });

                // res[0].save();

                // if (res[0].address instanceof AddressModel) {
                //   res[0].address.save();
                // } else {
                //   console.error('res[0].address is not a AddressModel instance');
                // }
              });

            // const user = new UserModel({
            //   _id: 1,
            //   name: 'Batman',
            //   age: 30,
            //   address: {
            //     _id: 101,
            //     no: 10,
            //     street: 'Gandhi street',
            //   },
            // });

            // user.save();

            // console.log(UserModel._schema);
            // console.log('user.validate()', JSON.parse(JSON.stringify(user)));
          }}
        >
          find
        </button>
      </div>
    </>
  );
}

export default App;
