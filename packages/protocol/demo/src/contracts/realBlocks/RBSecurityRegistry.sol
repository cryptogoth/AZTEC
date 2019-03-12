pragma solidity >=0.4.22 <0.6.0;

import "../AZTEC/AZTECERC20Bridge.sol";

contract RBSecurityRegistry {

    event TradeSymbolRegistered(
        string tradeSym,
	address contractAddr
    );

    // Public read-only list
    string[] public symbolList;

    // Not public because it shouldn't get an automatic setter
    mapping(string => address) symbolRegistry;

    // These are for instantiating new bridge contracts
    // They're the same for all tokens
    bytes32[4] public setupPubKey;
    uint256 public chainId;

    address public owner;

    constructor(bytes32[4] _setupPubKey, uint256 _chainId) public {
        setupPubKey = _setupPubKey;
        chainId = _chainId;
	owner = msg.sender;
    }

    // Don't accept payment
    function() external payable {
        revert();
    }

    /**
     * Creates and deploys a new bridge contract on-chain, then registers its trading symbol.
     * @param _tradeSym trading symbol as a UTF-8 string
     * @param _erc20Address the contract address for the ERC20 token to bridge
     * @param _scalingFactor the mapping from AZTEC note value to ERC20 token value
     */
    function registerNewBridge(
        string memory _tradeSym,
        address _erc20Address,
        uint256 _scalingFactor
        ) public {

        require(bytes(_tradeSym).length > 0);
        require(symbolRegistry[_tradeSym] == address(0));
	// require(msg.sender == owner); TODO re-enable when you can set the owner
        address bridgeContract = new AZTECERC20Bridge(
          setupPubKey, _erc20Address, _scalingFactor, chainId
        );
        symbolRegistry[_tradeSym] = bridgeContract;
        symbolList.push(_tradeSym);
        emit TradeSymbolRegistered(_tradeSym, bridgeContract);
    }

    function register(
        string memory _tradeSym,
	address _existingBridge
        ) public {

        require(bytes(_tradeSym).length > 0);
        require(symbolRegistry[_tradeSym] == address(0));
	// require(msg.sender == owner); TODO re-enable when you can set the owner
        symbolRegistry[_tradeSym] = _existingBridge;
        require(symbolRegistry[_tradeSym] != address(0));
        symbolList.push(_tradeSym);
        emit TradeSymbolRegistered(_tradeSym, _existingBridge);
    }

    function getSetupPubKey(uint8 index) public view returns (bytes32 pubKeyByte) {
        return setupPubKey[index];
    }

    function getSymbolCount() public view returns (uint256 symbolCount) {
        return symbolList.length;
    }

    function getBridgeAddress(string memory _tradeSym) public view returns (address bridgeContractAddr) {
        require(symbolRegistry[_tradeSym] != address(0));
        return symbolRegistry[_tradeSym];
    }

}
