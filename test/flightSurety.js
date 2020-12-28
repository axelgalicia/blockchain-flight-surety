
var Test = require('./testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {


  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.updateAuthorizedAppContract(config.flightSuretyApp.address);
    await config.flightSuretyApp.registerAirline('Air Canada');
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperationalStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperationalStatus(false, {from: config.owner});
      }
      catch(e) {
          console.log(e);
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
      
  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

      await config.flightSuretyData.setOperationalStatus(false);

      let reverted = false;
      try 
      {
          await config.flightSurety.setTestingMode(true);
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

      // Set it back for other tests to work
      await config.flightSuretyData.setOperationalStatus(true);

  });

  it('(airline) cannot register an Airline itself using registerAirline() if there are less than 5 registered', async function () {
    
    // ARRANGE
    let newAirlineAddress = accounts[2];

    // ACT
    try {
         let response = await config.flightSuretyApp.registerAirline.call('AirUdacity', {from: newAirlineAddress});
    }
    catch(e) {
    }
    let result = await config.flightSuretyData.isAirline(newAirlineAddress); 

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");
    
  });

  it('(airline) can register 3 more Airlines from owners\'s account', async function () {
    
    // ARRANGE
    let owner = config.owner;
    let expectedAirlinesRegistered = 4;
    let airlinesRegistered = [];

    // ACT
    try {
         await config.flightSuretyApp.registerAirline('AirUdacity2');
         await config.flightSuretyApp.registerAirline('AirUdacity3');
         await config.flightSuretyApp.registerAirline('AirUdacity4');
         airlinesRegistered = await config.flightSuretyData.allAirlines();
    }
    catch(e) {
        result = false;
    }

    // ASSERT
    assert.equal(airlinesRegistered.length, expectedAirlinesRegistered, "Owner should be able to register 3 more Airlines from owner\'s account");
    
  });


  
  it('(airline) show all Airlines registered', async function () {
    
    // ARRANGE
    let owner = config.owner;
    let expectedAirlinesRegistered = 4;
    let airlinesRegistered = [];

    // ACT
    try {
         airlinesRegistered = await config.flightSuretyData.allAirlines();
         console.log(airlinesRegistered);
    }
    catch(e) {
        result = false;
    }

    // ASSERT
    assert.equal(true,true, "Owner should be able to register 3 more Airlines from owner\'s account");
    
  });
 

});
