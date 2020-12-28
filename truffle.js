var HDWalletProvider = require("@truffle/hdwallet-provider");
var mnemonic = "syrup nurse bulk upper vote sing lesson wrist wall awkward spoon town";

module.exports = {
  networks: {
    development: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "http://127.0.0.1:8545/", 0, 100);
      },
      host: '127.0.0.1',
      port: 8545,
      network_id: '*',
      gas: 6721975,
      gasPrice: 20000000000,
      confirmations: 0,
      timeoutBlocks: 50,
      skipDryRun: true,
    }
  },

  compilers: {
    solc: {
      version: "0.8.0"
    }
  }
};