export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 16
npm install yarn -g
rm -rf ./cysync/node_modules
yarn install
node scripts/prebuild.js
yarn make
nvm uninstall 16
