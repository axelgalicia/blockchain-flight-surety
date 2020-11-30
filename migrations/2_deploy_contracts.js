const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const fs = require('fs');

module.exports = function (deployer, network, accounts) {

    let firstAccount = accounts[0];
    deployer.deploy(FlightSuretyData)
        .then(() => {
            return deployer.deploy(FlightSuretyApp, FlightSuretyData.address)
                .then(async () => {
                    let config = {
                        localhost: {
                            url: 'http://localhost:8545',
                            dataAddress: FlightSuretyData.address,
                            appAddress: FlightSuretyApp.address
                        }
                    }
                    fs.writeFileSync(__dirname + '/../dapp/config.json', JSON.stringify(config, null, '\t'), 'utf-8');
                    fs.writeFileSync(__dirname + '/../oracles/config.json', JSON.stringify(config, null, '\t'), 'utf-8');

                    let dataInstance = await FlightSuretyData.deployed();
                    let appInstance = await FlightSuretyApp.deployed();

                    // Authorize AppContract on DataContract
                    await dataInstance.updateAuthorizedAppContract(FlightSuretyApp.address, { from: firstAccount });
                    // Register First Airline by default
                    await appInstance.registerAirline('Air Canada', { from: firstAccount });

                    // Register First Flight by default
                    //await appInstance.registerFlight('Air Canada', {from: firstAccount});

                    // Get previous events
                    // data.getPastEvents('allEvents', {fromBlock: 0, toBlock :'latest'}).then(result => console.log(result))

                });
        });
}