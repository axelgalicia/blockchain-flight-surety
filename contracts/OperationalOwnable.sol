// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.0;


contract OperationalOwnable {
    // Blocks all state changes throughout the contract if false
    bool private operational = true;
    // Account used to deploy contract
    address payable private contractOwner;

    // Define an Event
    event UpdateOperationalStatus(bool mode);

    // Define an Event
    event TransferOwnership(address indexed oldOwner, address indexed newOwner);

    // Assign the contract to an owner
    constructor() {
        contractOwner = payable(msg.sender);
        emit TransferOwnership(address(0), contractOwner);
    }

    /**
     * @dev Modifier that requires the "operational" boolean variable to be "true"
     *      This is used on all state changing functions to pause the contract in
     *      the event there is an issue that needs to be fixed
     */

    modifier onlyOperational() {
        require(operational, "Contract is currently not operational");
        _; // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
     * @dev Get operating status of contract
     *
     * @return A bool that is the current operating status
     */

    function isOperational() public view returns (bool) {
        return operational;
    }

    /**
     * @dev Sets contract operations on/off
     *
     * When operational mode is disabled, all write transactions except for this one will fail
     */

    function setOperationalStatus(bool mode) external onlyOwner {
        emit UpdateOperationalStatus(mode);
        operational = mode;
    }

    // Define a function 'kill' if required
    function kill() public {
        if (msg.sender == contractOwner) {
            selfdestruct(contractOwner);
        }
    }

    // Look up the address of the owner
    function owner() public view returns (address) {
        return contractOwner;
    }

    // Define a function modifier 'onlyOwner'
    modifier onlyOwner() {
        require(isOwner(), "Only the owner can perform this operation");
        _;
    }

    // Check if the calling address is the owner of the contract
    function isOwner() public view returns (bool) {
        return msg.sender == contractOwner;
    }

    // Define a function to renounce ownerhip
    function renounceOwnership() public onlyOwner {
        emit TransferOwnership(contractOwner, address(0));
        contractOwner = payable(address(0));
    }

    // Define a public function to transfer ownership
    function transferOwnership(address payable newOwner) public onlyOwner {
        _transferOwnership(newOwner);
    }

    // Define an internal function to transfer ownership
    function _transferOwnership(address payable newOwner) internal {
        require(newOwner != address(0), "The new Owner cannot be address 0");
        contractOwner = newOwner;
        emit TransferOwnership(contractOwner, newOwner);
    }
}
