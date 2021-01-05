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

    // Fee to be paid when registering Airline
    uint256 public constant AIRLINE_REGISTRATION_FEE = 10 ether;

    address payable private authorizedAppContract;

    // Mappings
    mapping(string => Airline) private airlinesMap;
    mapping(uint256 => string) private airlineIdToNameMap;
    mapping(address => bool) private isARegisteredAirlineMap;
    mapping(string => uint256) private fundingPerAirlineMap;
    mapping(string => string[]) private airlineNameToAirlineVotersMap;
    mapping(string => Flight) private flightsMap;
    mapping(uint256 => string) private flightIdToNameMap;

    // Counters
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
    event NewAirlineVote(Airline fromAirline, Airline toAirline);

    event NewFlightRegistered(
        string airlineName,
        string flightName,
        uint256 timestamp
    );

    event TestStringValue(string value);
    event TestIntValue(uint256 value);
    event TestBooleanValue(bool value);

    /**
     * @dev Constructor
     *      The deploying account becomes contractOwner
     */
    constructor() {
        lastRegisteredAirlineId = 0;
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
        public
        onlyOwner onlyOperational
    {
        _updateAuthorizedAppContract(newAddress);
    }

    /**
     *   @dev Update the authorized app contract address
     *
     */
    function _updateAuthorizedAppContract(address payable newAddress) internal {
        require(
            newAddress != address(0),
            "The new contract address cannot be address 0"
        );
        authorizedAppContract = newAddress;
        emit AuthorizedAppContractUpdated(newAddress);
    }

    /**
     * @dev Add an airline to the registration queue
     *      Can only be called from FlightSuretyApp contract
     *
     */

    function registerAirline(address payable airlineAddress, string memory name)
        external
        onlyAuthorizedContract onlyOperational
    {
        bool isConsensusRequired = _isNumberOfAirlinesFourOrMore();
        if (isConsensusRequired) {
            require(
                !_isAirlineRegisteredForAccount(airlineAddress),
                "This account has an Airline already registered"
            );
            require(_isValidFeePaid(name), "Invalid Fee paid");
            _registerAirline(
                airlineAddress,
                name,
                AirlineStatus.PendingApproval,
                0
            );
        } else {
            require(
                isOwner(airlineAddress),
                "Only contract ownwer can register first 4 Airlines"
            );
            _registerAirline(airlineAddress, name, AirlineStatus.Registered, 5);
        }
    }

    function _registerAirline(
        address payable airlineAddress,
        string memory name,
        AirlineStatus status,
        uint256 votes
    ) internal {
        Airline memory newAirline = Airline(status, name, airlineAddress, votes);
        airlinesMap[name] = newAirline;
        lastRegisteredAirlineId = lastRegisteredAirlineId.add(1);
        isARegisteredAirlineMap[airlineAddress] = true;
        airlineIdToNameMap[lastRegisteredAirlineId] = name;
        emit NewAirlineRegistered(newAirline);
    }

    function _isValidFeePaid(string memory airlineName)
        internal
        returns (bool)
    {
        uint256 fee = AIRLINE_REGISTRATION_FEE;
        uint256 etherSent = msg.value;
        return etherSent <= fee && !_isFeeAlreadyPaid(airlineName);
    }

    function _isFeeAlreadyPaid(string memory airlineName)
        internal view
        returns (bool)
    {
        uint256 fee = AIRLINE_REGISTRATION_FEE;
        uint256 funded = fundingPerAirlineMap[airlineName];
        return funded == fee;
    }

    function getAirlineName(uint256 id) public view returns (string memory) {
        return airlineIdToNameMap[id];
    }

    function getFlightName(uint256 id) public view returns (string memory) {
        return flightIdToNameMap[id];
    }

    function getAirlineByName(string memory airlineName) public view returns (Airline memory) {
        return airlinesMap[airlineName];
    }

    function getFlightByName(string memory flightName) public view returns (Flight memory) {
        return flightsMap[flightName];
    }


    function getLastRegisteredAirlineId() public view returns (uint256) {
        return lastRegisteredAirlineId;
    }

    function getLastRegisteredFlightId() public view returns (uint256) {
        return lastRegisteredAirlineId;
    }

    function getFundingForAirlineName(string memory airlineName) public view returns (uint256) {
        return fundingPerAirlineMap[airlineName];
    }

    /**
     * @dev Add new Flight
     *
     */
    function registerFlight(
        address payable airlineAddress,
        string calldata airlineName,
        string memory flightName,
        uint256 flightTime
    ) external onlyAuthorizedContract onlyOperational {
        require(
            !_isFlightRegistered(flightName),
            "Flight name already registered"
        );

        require(_isFeeAlreadyPaid(airlineName), "Fee needs to be paid first");

        Airline memory airline = airlinesMap[airlineName];
        require(
            airline.ownerAddress == airlineAddress,
            "Airline does not exist"
        );

        require(_hasEnoughVotes(airline), "Insufficient Votes to operate");

        Flight memory newFlight =
            Flight(true, 0, flightTime, flightName, airline);

        flightsMap[flightName] = newFlight;
        lastRegisteredFlightId = lastRegisteredFlightId.add(1);
        flightIdToNameMap[lastRegisteredFlightId] = flightName;
        emit NewFlightRegistered(airline.name, flightName, flightTime);
    }

    function _hasEnoughVotes(Airline memory airline) internal view returns (bool) {
        uint256 requiredVotes = lastRegisteredFlightId.div(2);
        return requiredVotes <= airline.votes;
    }

    function vote(
        address payable airlineAddress,
        string memory ownAirlineName,
        string memory airlineNameToVote
    ) external onlyAuthorizedContract onlyOperational {
        require(
            _isFeeAlreadyPaid(ownAirlineName),
            "Fee needs to be paid first"
        );
        Airline storage airline = airlinesMap[ownAirlineName];
        require(
            airline.ownerAddress == airlineAddress,
            "Airline does not exist"
        );
        require(!_isSameString(airlineNameToVote, ownAirlineName), "Cannot Vote for itself");
        string[] memory voters =
            airlineNameToAirlineVotersMap[airlineNameToVote];
        for (uint256 i = 0; i < voters.length; i++) {
            require(
                !_isSameString(voters[i], ownAirlineName),
                "Already voted for this Airline"
            );
        }
        Airline storage airlineToVote = airlinesMap[airlineNameToVote];
        uint256 votes = airlineToVote.votes;
        airlinesMap[airlineNameToVote].votes = votes.add(1);
        airlineNameToAirlineVotersMap[airlineNameToVote].push(ownAirlineName);
        emit NewAirlineVote(airline, airlineToVote);
    }

    function _isSameString(string memory a, string memory b)
        internal
        pure
        returns (bool)
    {
        return (keccak256(abi.encodePacked((a))) ==
            keccak256(abi.encodePacked((b))));
    }

    /**
     * @dev Buy insurance for a flight
     *
     */

    function buy() external payable {}

    /**
     *  @dev Credits payouts to insurees
     */
    function creditInsurees() external pure {}

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
     */
    function pay() external pure {}

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
     * @dev Initial funding for the insurance. Unless there are too many delayed flights
     *      resulting in insurance payouts, the contract should be self-sustaining
     *
     */

    function fund() public payable {}

    function payAirlineFee(string memory airlineName) public payable 
    onlyOperational
    returns (bool)
    {
        require(_isValidFeePaid(airlineName), "Invalid Fee paid");
        uint256 funded = fundingPerAirlineMap[airlineName];
        fundingPerAirlineMap[airlineName] = funded.add(msg.value);
        return true;
    }

    function _isNumberOfAirlinesFourOrMore() internal view returns (bool) {
        return lastRegisteredAirlineId >= 4;
    }

    function isAirline(address payable airlineAddress)
        public
        view
        returns (bool)
    {
        return _isAirlineRegisteredForAccount(airlineAddress);
    }

    function _isAirlineRegisteredForAccount(address payable airlineAddress)
        internal
        view
        returns (bool)
    {
        return isARegisteredAirlineMap[airlineAddress];
    }

    function _isFlightRegistered(string memory flightName)
        internal
        view
        returns (bool)
    {
        return flightsMap[flightName].isRegistered;
    }

    function _getFlightKey(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }
}
