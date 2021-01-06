// SPDX-License-Identifier: GPL-3.0
pragma experimental ABIEncoderV2;
pragma solidity 0.8.0;

import "./SafeMath.sol";
import "./OperationalOwnable.sol";

contract FlightSuretyData is OperationalOwnable {
    // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address payable private authorizedAppContract;

    // Mappings
    mapping(string => Airline) private airlinesMap;
    mapping(uint256 => string) private airlineIdToNameMap;
    mapping(address => bool) private isARegisteredAirlineMap;
    mapping(string => uint256) private fundingPerAirlineMap;
    mapping(string => string[]) private airlineNameToAirlineVotersMap;
    mapping(string => Flight) private flightsMap;
    mapping(uint256 => string) private flightIdToNameMap;

    // Ids
    uint256 private lastRegisteredAirlineId;
    uint256 private lastRegisteredFlightId;

    enum AirlineStatus {PendingApproval, Registered, Paid}

    struct Airline {
        AirlineStatus status;
        string name;
        address ownerAddress;
        uint256 votes;
    }

    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;
        string name;
        Airline airline;
    }

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    event AuthorizedAppContractUpdated(address payable newAddress);

    event NewAirlineRegistered(Airline airline);
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
        AirlineStatus status,
        uint256 votes
    ) external onlyOperational onlyAuthorizedContract {
        _registerAirline(airlineAddress, name, status, votes);
    }

    function getAirlineName(uint256 id)
        external
        view
        onlyAuthorizedContract
        onlyOperational
        returns (string memory)
    {
        return airlineIdToNameMap[id];
    }

    function getFlightName(uint256 id)
        external
        view
        onlyAuthorizedContract
        onlyOperational
        returns (string memory)
    {
        return flightIdToNameMap[id];
    }

    function getAirlineByName(string memory airlineName)
        external
        view
        onlyAuthorizedContract
        onlyOperational
        returns (Airline memory)
    {
        return airlinesMap[airlineName];
    }

    function getFlightByName(string memory flightName)
        external
        view
        onlyAuthorizedContract
        onlyOperational
        returns (Flight memory)
    {
        return flightsMap[flightName];
    }

    function getLastRegisteredAirlineId()
        external
        view
        onlyAuthorizedContract
        onlyOperational
        returns (uint256)
    {
        return lastRegisteredAirlineId;
    }

    function getLastRegisteredFlightId()
        external
        view
        onlyAuthorizedContract
        onlyOperational
        returns (uint256)
    {
        return lastRegisteredAirlineId;
    }

    function getFundingForAirlineName(string memory airlineName)
        external
        view
        onlyAuthorizedContract
        onlyOperational
        returns (uint256)
    {
        return fundingPerAirlineMap[airlineName];
    }

    function getAirlineVoters(string memory airlineName)
        external
        view
        onlyAuthorizedContract
        onlyOperational
        returns (string[] memory)
    {
        return airlineNameToAirlineVotersMap[airlineName];
    }

    function payAirlineFee(string memory airlineName) external payable {
        fundingPerAirlineMap[airlineName] = fundingPerAirlineMap[airlineName]
            .add(fund);
    }

    function addVote(
        string memory ownAirlineName,
        string memory airlineNameToVote
    ) external onlyAuthorizedContract onlyOperational {
        Airline storage airlineToVote = airlinesMap[airlineNameToVote];
        uint256 votes = airlineToVote.votes;
        airlinesMap[airlineNameToVote].votes = votes.add(1);
        airlineNameToAirlineVotersMap[airlineNameToVote].push(ownAirlineName);
        emit NewAirlineVote(ownAirlineName, airlineNameToVote);
    }

    function isARegisteredAirline(address payable airlineAddress)
        external
        view
        onlyAuthorizedContract
        onlyOperational
        returns (bool)
    {
        return isARegisteredAirlineMap[airlineAddress];
    }

    /**
     *
     * Private functions
     *
     */

    function _registerAirline(
        address payable airlineAddress,
        string memory name,
        AirlineStatus status,
        uint256 votes
    ) private {
        Airline memory newAirline =
            Airline(status, name, airlineAddress, votes);
        airlinesMap[name] = newAirline;
        lastRegisteredAirlineId = lastRegisteredAirlineId.add(1);
        isARegisteredAirlineMap[airlineAddress] = true;
        airlineIdToNameMap[lastRegisteredAirlineId] = name;
        emit NewAirlineRegistered(newAirline);
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
