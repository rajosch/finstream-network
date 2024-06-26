#!/bin/bash

# Function to start a local server in a new tab
start_server() {
  local folder=$1
  local command=$2
  gnome-terminal --tab -- bash -c "cd $folder && $command; exec bash"
  echo "Started server in $folder with command: $command"
}

# Function to start the blockchain node in a new tab
start_blockchain_node() {
  local folder=$1
  local command=$2
  gnome-terminal --tab -- bash -c "cd $folder && $command; exec bash"
  echo "Started blockchain node in $folder with command: $command"
}

# Function to start the Nuxt3 app in dev mode in a new tab
start_nuxt3_app() {
  local folder=$1
  local command=$2
  gnome-terminal --tab -- bash -c "cd $folder && $command; exec bash"
  echo "Started Nuxt3 app in $folder with command: $command"
}

# Function to run the setup script in a new tab and close the tab when done
run_setup_script() {
  local folder=$1
  local command=$2
  gnome-terminal --tab -- bash -c "cd $folder && $command; exec bash -c 'exit'"
  echo "Ran setup script in $folder with command: $command"
}

# Start the first local server
start_server "iso20022-message-gateway/packages/gateway/" "pnpm start"

# Start the second local server
start_server "bank/" "pnpm start"

# Start the local blockchain node
start_blockchain_node "smart-contracts/" "npx hardhat node"

# Wait for the blockchain node to fully start
echo "Waiting for the blockchain node to start..."
sleep 15

# Run the setup script
run_setup_script "smart-contracts/" "npx hardhat run scripts/setupFinstream.js --network localhost"

# Wait for the blockchain node to fully start
echo "Waiting for the Finstream contracts to be deployed..."
sleep 10  

# Start the Nuxt3 app in dev mode
start_nuxt3_app "frontend/" "pnpm dev"

echo "All tasks started in new tabs."
