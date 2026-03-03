// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title GenLoopPoints
 * @notice GenLoop 积分代币 (ERC20)
 */
contract GenLoopPoints is ERC20, AccessControl {
    
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 10亿代币
    
    event PointsMinted(address indexed to, uint256 amount);
    event PointsBurned(address indexed from, uint256 amount);
    
    constructor() ERC20("GenLoop Points", "GLP") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
    }
    
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
        emit PointsMinted(to, amount);
    }
    
    function burn(address from, uint256 amount) external onlyRole(BURNER_ROLE) {
        _burn(from, amount);
        emit PointsBurned(from, amount);
    }
    
    function burnFrom(address from, uint256 amount) external onlyRole(BURNER_ROLE) {
        _burn(from, amount);
        emit PointsBurned(from, amount);
    }
    
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}
