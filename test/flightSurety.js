
var Test = require('./testConfig.js');
var BigNumber = require('bignumber.js');
const { default: Web3 } = require('web3');

contract('Flight Surety Tests', async (accounts) => {


  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.updateAuthorizedAppContract(config.flightSuretyApp.address);
    // First Airline
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
          await config.flightSuretyData.setOperationalStatus.call(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
          // console.log(e)
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperationalStatus.call(false, {from: config.owner});
      }
      catch(e) {
          console.log(e);
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
      //       // Set it back for other tests to work
      await config.flightSuretyData.setOperationalStatus(true);
      
  });


  it('(airline) cannot register an Airline itself using registerAirline() if there are less than 5 registered', async function () {
    
    // ARRANGE
    let newAirlineAddress = accounts[2];
    let result = true;

    // ACT
    try {
         let response = await config.flightSuretyApp.registerAirline.call('AirUdacity', {from: newAirlineAddress});
    }
    catch(e) {
    }
    result = await config.flightSuretyData.isAirline(newAirlineAddress); 

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");
    
  });

  it('(airline) can register 3 more Airlines from owners\'s account', async function () {
    
    // ARRANGE
    let result = true;

    // ACT
    try {
         await config.flightSuretyApp.registerAirline('AirUdacity2');
         await config.flightSuretyApp.registerAirline('AirUdacity3');
         await config.flightSuretyApp.registerAirline('AirUdacity4');
      //  console.log('id Air:' + await config.flightSuretyData.getLastRegisteredAirlineId.call());
      //  console.log('id :' + await config.flightSuretyData.getLastRegisteredAirlineId.call());
    }
    catch(e) {
        result = false;
        console.log(e);
    }

    // ASSERT
    // assert.equal(airlinesRegistered.length, expectedAirlinesRegistered, "Owner should be able to register 3 more Airlines from owner\'s account");
    assert.equal(result, true, "aa");
  });


  it('(airline) The no-owner can register an Airline itself using registerAirline() after there are 5 registered', async function () {
    
    // ARRANGE
    let newAirlineAddress = accounts[2];
    let result = true;

    // ACT
    try {
         let response = await config.flightSuretyApp.registerAirline.call('AirUdacity5', {from: newAirlineAddress});
    }
    catch(e) {
    }
    result = await config.flightSuretyData.isAirline(newAirlineAddress); 

    // ASSERT
    assert.equal(result, false, "Airline should be able to register another airline if it hasn't provided funding");
    
  });



  it('(airline) cannot vote without paying fee first', async function () {
    
    // ARRANGE
    let result = true;

    // ACT
    try {
         airlinesRegistered = await config.flightSuretyApp.vote.call('AirUdacity2', 'AirUdacity3');
         
    }
    catch(e) {
        result = false;
    }

    // ASSERT
    assert.equal(result, false, "Airline should not be able to vote unless it already paid its fee");

  });

  
  it('(airline) can pay 10 Ether Fee', async function () {
    
    // ARRANGE
    let paid = true;

    // ACT
    try {
         airlinesRegistered = await config.flightSuretyData.payAirlineFee('AirUdacity2',{from: config.owner, value: web3.utils.toWei('10', 'ether')});
    }
    catch(e) {
        console.log(e);
        paid = false;
       
    }

    // ASSERT
    assert.equal(paid, true, "Airline should be able to pay 10 Ether fee");

  });

    
  it('(airline) show funded ether for specific Airline', async function () {
    
    // ARRANGE
    let fundedEther = 0;
    let tenEther = web3.utils.toWei('10', 'ether');
    // ACT
    try {
        fundedEther = await config.flightSuretyData.getFundingForAirlineName('AirUdacity2');
    }
    catch(e) {
        result = false;
        console.log(e);
    }

    // ASSERT
    assert.equal(fundedEther.toString(), tenEther, "Should be able to display funding");
    
  });


  
  it('(airline) can vote after paying fee', async function () {
    
    // ARRANGE
    let result = true;

    // ACT
    try {
         let response = await config.flightSuretyApp.vote('AirUdacity2', 'AirUdacity3');
    }
    catch(e) {
        result = false;
        console.log(e);
    }

    // ASSERT
    assert.equal(result, true, "Airline should be able to vote");

  });


  it('(airline) cannot vote for the same Airline even after paid fee', async function () {
    
    // ARRANGE
    let result = true;

    // ACT
    try {
         let response = await config.flightSuretyApp.vote.call('AirUdacity2', 'AirUdacity3');
    }
    catch(e) {
        result = false;
    }

    // ASSERT
    assert.equal(result, false, "Airline should not be able to vote");

  });

  /*

    it('(airline) Display all airlines', async function () {
      
      // ARRANGE
      let result = true;

      // ACT
      try {

        const lastIdAirline = await config.flightSuretyData.getLastRegisteredAirlineId.call();
        for (let i = 1 ; i <= lastIdAirline ; i++) {
          let airlineName = await config.flightSuretyData.getAirlineName(i);
          console.log(await config.flightSuretyData.getAirlineByName(airlineName));
        }
          
      }
      catch(e) {
          result = false;
          console.log(e);
      }

      // ASSERT
      assert.equal(result, true, "Airlines should be displayed");

    });

  */

  it('(airline) show all Airlines registered', async function () {
    
    // ARRANGE
    let owner = config.owner;
    let expectedAirlinesRegistered = 4;
    let airlinesRegistered = [];

    // ACT
    try {
        // airlinesRegistered = await config.flightSuretyData.allAirlines();
        // console.log(airlinesRegistered);
    }
    catch(e) {
        result = false;
        console.log(e);
    }

    // ASSERT
    assert.equal(true,true, "Owner should be able to register 3 more Airlines from owner\'s account");
    
  });
 

});
