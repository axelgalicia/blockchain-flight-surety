// SPDX-License-Identifier: GPL-3.0
pragma experimental ABIEncoderV2;
pragma solidity 0.8.0;

import "./SafeMath.sol";
import "./SharedModel.sol";
import "./OperationalOwnable.sol";

contract FlightSuretyData is OperationalOwnable {
    // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address payable private authorizedAppContract;

    // Mappings
    mapping(string => SharedModel.Airline) private airlinesMap;
    mapping(uint256 => string) private airlineIdToNameMap;
    mapping(address => bool) private isARegisteredAirlineMap;
    mapping(string => uint256) private fundingPerAirlineMap;
    mapping(string => string[]) private airlineNameToAirlineVotersMap;
    mapping(string => SharedModel.Flight) private flightsMap;
    mapping(uint256 => string) private flightIdToNameMap;

    // Ids
    uint256 private lastRegisteredAirlineId;
    uint256 private lastRegisteredFlightId;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    event AuthorizedAppContractUpdated(address payable newAddress);

    event NewAirlineRegistered(SharedModel.Airline airline);
    event NewAirlineVote(string fromAirline, string toAirline);

    event NewFlightRegistered(
        string airlineName,
        string flightName,
        uint256 timestamp
    );

    /**
     * @dev Constructor
     *      The deploying account becomes contractOwner
     */
    constructor() {
        lastRegisteredAirlineId = 0;
        lastRegisteredFlightId = 0;
    }

    /**
     * @dev Fallback function for funding smart contract.
     */
    fallback() external payable {
        fund();
    }

    receive() external payable {
        fund();
    }

    function fund() public payable {}

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    modifier onlyAuthorizedContract() {
        require(
            msg.sender == authorizedAppContract,
            "Caller not authorized to make this call"
        );
        _;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    /**
     *   @dev Update the authorized app contract address
     *
     */
    function updateAuthorizedAppContract(address payable newAddress)
        external
        onlyOwner
        onlyOperational
    {
        _updateAuthorizedAppContract(newAddress);
    }

    function registerAirline(
        address payable airlineAddress,
        string memory name,
        SharedModel.AirlineStatus status,
        uint256 votes
    ) external onlyOperational onlyAuthorizedContract {
        _registerAirline(airlineAddress, name, status, votes);
    }

    function registerFlight(
        SharedModel.Airline memory airline,
        string calldata flightName,
        uint256 flightTime
    ) external onlyOperational onlyAuthorizedContract {
        _registerFlight(airline, flightName, flightTime);
    }

    function getAirlineName(uint256 id)
        external
        view
        onlyOperational
        returns (string memory)
    {
        return airlineIdToNameMap[id];
    }

    function getFlightName(uint256 id)
        external
        view
        onlyOperational
        returns (string memory)
    {
        return flightIdToNameMap[id];
    }

    function getAirlineByName(string memory airlineName)
        external
        view
        onlyOperational
        returns (SharedModel.Airline memory)
    {
        return airlinesMap[airlineName];
    }

    function getFlightByName(string memory flightName)
        external
        view
        onlyOperational
        returns (SharedModel.Flight memory)
    {
        return flightsMap[flightName];
    }

    function getLastRegisteredAirlineId()
        external
        view
        onlyOperational
        returns (uint256)
    {
        return lastRegisteredAirlineId;
    }

    function getLastRegisteredFlightId()
        external
        view
        onlyOperational
        returns (uint256)
    {
        return lastRegisteredFlightId;
    }

    function getFundingForAirlineName(string memory airlineName)
        external
        view
        onlyOperational
        returns (uint256)
    {
        return fundingPerAirlineMap[airlineName];
    }

    function getAirlineVoters(string memory airlineName)
        external
        view
        onlyOperational
        returns (string[] memory)
    {
        return airlineNameToAirlineVotersMap[airlineName];
    }

    function payAirlineFee(string memory airlineName) external payable {
        fundingPerAirlineMap[airlineName] = fundingPerAirlineMap[airlineName]
            .add(msg.value);
    }

    function addVote(
        string memory ownAirlineName,
        string memory airlineNameToVote,
        SharedModel.AirlineStatus status
    ) external onlyAuthorizedContract onlyOperational {
        SharedModel.Airline storage airlineToVote =
            airlinesMap[airlineNameToVote];
        uint256 votes = airlineToVote.votes;
        airlinesMap[airlineNameToVote].votes = votes.add(1);
        airlinesMap[airlineNameToVote].status = status;
        airlineNameToAirlineVotersMap[airlineNameToVote].push(ownAirlineName);
        emit NewAirlineVote(ownAirlineName, airlineNameToVote);
    }

    function isARegisteredAirline(address payable airlineAddress)
        external
        view
        onlyOperational
        returns (bool)
    {
        return isARegisteredAirlineMap[airlineAddress];
    }

    function isFlightRegistered(string memory flightName)
        external
        view
        onlyOperational
        returns (bool)
    {
        return flightsMap[flightName].isRegistered;
    }

    /**
     *
     * Private functions
     *
     */

    function _registerAirline(
        address payable airlineAddress,
        string memory name,
        SharedModel.AirlineStatus status,
        uint256 votes
    ) private {
        SharedModel.Airline memory newAirline =
            SharedModel.Airline(status, name, airlineAddress, votes);
        airlinesMap[name] = newAirline;
        lastRegisteredAirlineId = lastRegisteredAirlineId.add(1);
        isARegisteredAirlineMap[airlineAddress] = true;
        airlineIdToNameMap[lastRegisteredAirlineId] = name;
        emit NewAirlineRegistered(newAirline);
    }

    function _registerFlight(
        SharedModel.Airline memory airline,
        string calldata flightName,
        uint256 flightTime
    ) private {
        SharedModel.Flight memory newFlight =
            SharedModel.Flight(true, 0, flightTime, flightName, airline);

        flightsMap[flightName] = newFlight;
        lastRegisteredFlightId = lastRegisteredFlightId.add(1);
        flightIdToNameMap[lastRegisteredFlightId] = flightName;
        emit NewFlightRegistered(airline.name, flightName, flightTime);
    }

    /**
     *   @dev Update the authorized app contract address
     *
     */
    function _updateAuthorizedAppContract(address payable newAddress) private {
        require(
            newAddress != address(0),
            "The new contract address cannot be address 0"
        );
        authorizedAppContract = newAddress;
        emit AuthorizedAppContractUpdated(newAddress);
    }
}
