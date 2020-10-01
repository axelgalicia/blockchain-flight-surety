var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "syrup nurse bulk upper vote sing lesson wrist wall awkward spoon town";

module.exports = {
  networks: {
    // development: {
    //   provider: function() {
    //     return new HDWalletProvider(mnemonic, "http://127.0.0.1:8545/", 0, 50);
    //   },
    //   network_id: '*',
    //   gas: 6721975
    // },
    dev1: {
      host: "127.0.0.1",
      port: 8545,
      network_id: '*',
      gas: 6721975
    }
  },
  compilers: {
    solc: {
      version: "0.7.0"
    }
  }
};