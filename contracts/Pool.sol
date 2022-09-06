// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./PoolToken.sol";

contract Pool {
    IERC20 public stable;
    PoolToken public pToken;
    uint public constant percentage = 125;

    constructor(address _stable, address _pToken) {
        stable = IERC20(_stable);
        pToken = PoolToken(_pToken);
    }

    function deposit(uint256 amount, address tokenAddress) external {
        require(amount >= 100 && amount <= 1000 ether, "Amount not in range");
        require(tokenAddress == address(stable), "Only stable");
        require(stable.balanceOf(msg.sender) >= amount, "Not enough balance");
        require(
            stable.allowance(msg.sender, address(this)) >= amount,
            "Not enough allowance"
        );

        stable.transferFrom(msg.sender, address(this), amount);
        pToken.mint(msg.sender, amount / 10);
    }

    function withdraw(uint256 amount) external {
        require(amount >= 100 && amount <= 1000 ether, "Amount not in range");
        uint pTokenAmount = amount / 10;
        require(
            pToken.balanceOf(msg.sender) >= pTokenAmount,
            "Pool: Not enough balance"
        );
        uint pTokenTotalValue = (pToken.totalSupply() * percentage) / 100;
        uint profit = (pTokenAmount * pTokenTotalValue) / pToken.totalSupply();
        pToken.burn(msg.sender, pTokenAmount);
        stable.transfer(msg.sender, profit * 10);
    }
}
