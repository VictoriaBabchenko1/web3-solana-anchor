# Solana Frontend DApp

This project is a React-based decentralized application (DApp) that interacts with a Solana program using the Anchor framework.

## Getting Started

### Installation

Install all dependencies:
#### `yarn install`

### Configure Environment Variables
Create a `.env` file in the root directory with the required environment variables.
For convenience, you can preview `.env.example` file

### Add the IDL and TypeScript definitions
Copy the IDL and TypeScript definitions for your Anchor program to the frontend:

#### Option 1: Run separate scripts
* To copy the IDL file:
#### `yarn run copy-idl`
This will create the app/src/lib/idl directory (if it doesn’t exist) and copy the IDL file from target/idl/.

* To copy the TypeScript types:
#### `yarn run copy-types`
This will create the app/src/lib/types directory and copy the generated types from target/types/.

#### Option 2: Run both together
To copy both IDL and types:
#### `yarn run copy-idl-types`


### Run the App
Run the app in the development mode:
#### `yarn vite`

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.
The page will reload if you make edits.


### Deploy
Steps for Deployment
1. Build the Docker image:
   #### `docker build -t react-nginx-app .`
2. Run the Docker container:
   #### `docker run --name react-nginx-app -p 5173:80 -d react-nginx-app`


## Notes
* Make sure your Anchor program is deployed and the generated IDL/types are available in `target/idl/` and `target/types/`.
* The app uses the wallet adapter, so ensure a Solana-compatible wallet like Phantom is installed in your browser.

## Learn More

* [React documentation](https://reactjs.org/).
* [Vite documentation](https://vite.dev/).
* [Anchor Documentation](https://www.anchor-lang.com/docs).
* [Solana Documentation](https://solana.com/ru/docs).
