// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Fixed version: no addition that can wrap, no `unchecked`.
contract BankFixed {
    mapping(address => uint256) balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 amt, uint256 fee) public returns (uint256) {
        uint256 bal = balances[msg.sender];
        require(amt <= bal && fee <= bal - amt); 
        balances[msg.sender] = bal - amt - fee;
        payable(msg.sender).transfer(amt);
        return amt;
    }
}


contract BankFixedSpec is BankFixed {
    function spec(uint256 amt, uint256 fee) external {
        uint256 owned = balances[msg.sender];
        uint256 paid = withdraw(amt, fee);
        assert(paid <= owned);                        
    }
}
