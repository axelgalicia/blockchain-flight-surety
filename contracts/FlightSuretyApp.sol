// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.0;

import "./SafeMath.sol";
import "./OperationalOwnable.sol";
import "./FlightSuretyData.sol";

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp is OperationalOwnable {
    // It's important to avoid vulnerabilities due to numeric overflow bugs
    // OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
    // More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

    // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

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

    // Data contract
    FlightSuretyData dataContract;

    // Fee to be paid when registering Airline
    uint256 public constant AIRLINE_REGISTRATION_FEE = 10 ether;
    // Flight status codes
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    // region ORACLE MANAGEMENT

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;
    }

    // Model for responses from oracles
    struct ResponseInfo {
        address requester; // Account that requested status
        bool isOpen; // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses; // Mapping key is the status code reported
        // This lets us group responses and identify
        // the response that majority of the oracles
    }

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(
        address airline,
        string flight,
        uint256 timestamp,
        uint8 status
    );

    event OracleReport(
        address airline,
        string flight,
        uint256 timestamp,
        uint8 status
    );

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(
        uint8 index,
        address airline,
        string flight,
        uint256 timestamp
    );

    event TestingValue(string value);

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
     * @dev Contract constructor
     *
     */
    constructor(address payable dataContractAddress) {
        dataContract = FlightSuretyData(dataContractAddress);
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    /**
     * @dev Add an airline to the registration queue
     */
    function registerAirline(string calldata airlineName)
        external
        onlyOperational
    {
        require(bytes(airlineName).length > 0, "Name cannot be empty");
        bool isConsensusRequired = _isNumberOfAirlinesFourOrMore();
        address payable airlineAddress = payable(msg.sender);

        if (isConsensusRequired) {
            require(
                !_isAirlineRegisteredForAccount(airlineAddress),
                "This account has an Airline already registered"
            );
            require(_isValidFeePaid(airlineName), "Invalid Fee paid");
            dataContract.registerAirline(
                airlineAddress,
                airlineName,
                AirlineStatus.PendingApproval,
                0
            );
        } else {
            require(
                isOwner(airlineAddress),
                "Only contract ownwer can register first 4 Airlines"
            );
            dataContract.registerAirline(
                airlineAddress,
                airlineName,
                AirlineStatus.Registered,
                5
            );
        }

        dataContract.registerAirline(airlineAddress, airlineName);
    }

    function payAirlineFee(string memory airlineName)
        external
        payable
        onlyOperational
    {
        require(bytes(airlineName).length > 0, "Airline Name cannot be empty");
        require(_isValidFeePaid(airlineName), "Invalid Fee paid");
        dataContract.payAirlineFee{value: msg.value}(airlineName);
    }

    function vote(string memory ownAirlineName, string memory airlineNameToVote)
        external
        onlyOperational
    {
        require(
            bytes(ownAirlineName).length > 0,
            "Own airline name cannot be empty"
        );
        require(
            bytes(airlineNameToVote).length > 0,
            "Airline name to vote cannot be empty"
        );
        require(
            _isFeeAlreadyPaid(ownAirlineName),
            "Fee needs to be paid first"
        );

        Airline storage airline = dataContract.getAirlineByName(ownAirlineName);
        address payable ownAirlineAddress = payable(msg.sender);
        require(
            airline.ownerAddress == ownAirlineAddress,
            "Airline does not exist"
        );
        require(
            !_isSameString(airlineNameToVote, ownAirlineName),
            "Cannot Vote for itself"
        );
        string[] memory voters =
            dataContract.getAirlineVoters(airlineNameToVote);
        for (uint256 i = 0; i < voters.length; i++) {
            require(
                !_isSameString(voters[i], ownAirlineName),
                "Already voted for this Airline"
            );
        }

        dataContract.addVote(ownAirlineName, airlineNameToVote);
    }

    function vote(
        address payable airlineAddress,
        string memory ownAirlineName,
        string memory airlineNameToVote
    ) external onlyOperational {}

    /**
     * @dev Register a future flight for insuring.
     *
     */
    function registerFlight(
        string calldata airlineName,
        string calldata flightName,
        uint256 timestamp
    ) external onlyOperational {
        require(bytes(flightName).length > 0, "Flight Name cannot be empty");
        require(bytes(airlineName).length > 0, "Airline Name cannot be empty");
        dataContract.registerFlight(
            payable(msg.sender),
            airlineName,
            flightName,
            timestamp
        );
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
    ) external onlyOperational {
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

    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus(
        address airline,
        string calldata flight,
        uint256 timestamp
    ) external onlyOperational {
        uint8 index = _getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key =
            keccak256(abi.encodePacked(index, airline, flight, timestamp));
        oracleResponses[key].requester = msg.sender;
        oracleResponses[key].isOpen = true;

        emit OracleRequest(index, airline, flight, timestamp);
    }

    // Register an oracle with the contract
    function registerOracle() external payable onlyOperational {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({isRegistered: true, indexes: indexes});
    }

    function getMyIndexes() external view returns (uint8[3] memory) {
        require(
            oracles[msg.sender].isRegistered,
            "Not registered as an oracle"
        );

        return oracles[msg.sender].indexes;
    }

    function getDataContractAddress() external view returns (address payable) {
        return payable(dataContract);
    }

    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse(
        uint8 index,
        address airline,
        string calldata flight,
        uint256 timestamp,
        uint8 statusCode
    ) external onlyOperational {
        require(
            (oracles[msg.sender].indexes[0] == index) ||
                (oracles[msg.sender].indexes[1] == index) ||
                (oracles[msg.sender].indexes[2] == index),
            "Index does not match oracle request"
        );

        bytes32 key =
            keccak256(abi.encodePacked(index, airline, flight, timestamp));
        require(
            oracleResponses[key].isOpen,
            "Flight or timestamp do not match oracle request"
        );

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (
            oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES
        ) {
            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
     * @dev Called after oracle has updated flight status
     *
     */
    function processFlightStatus(
        address airline,
        string memory flight,
        uint256 timestamp,
        uint8 statusCode
    ) internal pure {}

    function getFlightKey(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes(address account)
        private
        returns (uint8[3] memory)
    {
        uint8[3] memory indexes;
        indexes[0] = _getRandomIndex(account);

        indexes[1] = indexes[0];
        while (indexes[1] == indexes[0]) {
            indexes[1] = _getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while ((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = _getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function _getRandomIndex(address account) private returns (uint8) {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random =
            uint8(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            blockhash(block.number - nonce++),
                            account
                        )
                    )
                ) % maxValue
            );

        if (nonce > 250) {
            nonce = 0; // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

    function _isFeeAlreadyPaid(string memory airlineName)
        private
        view
        returns (bool)
    {
        uint256 fee = AIRLINE_REGISTRATION_FEE;
        uint256 funded = fundingPerAirlineMap[airlineName];
        return funded == fee;
    }

    function _hasEnoughVotes(Airline memory airline)
        private
        view
        returns (bool)
    {
        uint256 requiredVotes = lastRegisteredFlightId.div(2);
        return requiredVotes <= airline.votes;
    }

    function _isSameString(string memory a, string memory b)
        internal
        pure
        returns (bool)
    {
        return (keccak256(abi.encodePacked((a))) ==
            keccak256(abi.encodePacked((b))));
    }

    function _isNumberOfAirlinesFourOrMore() internal view returns (bool) {
        return dataContract.getLastRegisteredAirlineId() >= 4;
    }

    function isAirline(address payable airlineAddress)
        private
        view
        returns (bool)
    {
        return _isAirlineRegisteredForAccount(airlineAddress);
    }

    function _isAirlineRegisteredForAccount(address payable airlineAddress)
        private
        view
        returns (bool)
    {
        return dataContract.isARegisteredAirline(airlineAddress);
    }

    function _isFlightRegistered(string memory flightName)
        private
        view
        returns (bool)
    {
        return flightsMap[flightName].isRegistered;
    }

    function _isValidFeePaid(string memory airlineName)
        private
        view
        returns (bool)
    {
        uint256 fee = AIRLINE_REGISTRATION_FEE;
        uint256 etherSent = msg.value;
        uint256 currentFunded =
            dataContract.getFundingForAirlineName(airlineName);
        uint256 totalFund = etherSend.add(currentFunded);
        return totalFund <= fee;
    }

    function _isFeeAlreadyPaid(string memory airlineName)
        private
        view
        returns (bool)
    {
        uint256 fee = AIRLINE_REGISTRATION_FEE;
        uint256 funded = dataContract.getFundingForAirlineName(airlineName);
        return funded >= fee;
    }

    function _getFlightKey(
        address airline,
        string memory flight,
        uint256 timestamp
    ) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // endregion
}
