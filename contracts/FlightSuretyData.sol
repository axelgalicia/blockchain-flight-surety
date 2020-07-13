pragma solidity ^0.6.4;

import "./SafeMath.sol";
import "./OperationalOwnable.sol";

contract FlightSuretyData is OperationalOwnable {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address payable private authorizedAppContract;

    mapping(address => Airline) private airlines;

    enum AirlineStatus {
        PendingApproval, 
        Registered, 
        Paid
    }

    struct Airline {
        AirlineStatus status;
        string name;
    }

    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;
        address payable airline;
    }

    mapping(bytes32 => Flight) private flights;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    event AuthorizedAppContractUpdated(address payable newAddress);

    event NewAirlineRegistered(address payable airline);

    /**
     * @dev Constructor
     *      The deploying account becomes contractOwner
     */
    constructor() public {}

    /**
     * @dev Fallback function for funding smart contract.
     */
    fallback() external payable {
        fund();
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    modifier onlyAuthorizedContract() {
        require(msg.sender == authorizedAppContract, "Caller not authorized to make this call");
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
        onlyOwner
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

    function registerAirline(address payable airline, string calldata name)
        external
        onlyAuthorizedContract
    {
        require(bytes(airlines[airline].name).length > 0, "Airline already registered");
        Airline memory newAirline = Airline(AirlineStatus.Registered, name);
        airlines[airline] = newAirline;
        emit NewAirlineRegistered(airline);
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

    function getFlightKey(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }
}
