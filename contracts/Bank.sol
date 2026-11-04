// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// This is VULNERABLE on purpose. Companion code for the Paged Out! article
contract Bank {
    mapping(address => uint256) balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 amt, uint256 fee) public returns (uint256) {
        uint256 bal = balances[msg.sender];
        unchecked {
            require(bal >= amt + fee);
            balances[msg.sender] = bal - (amt + fee);
        }
        payable(msg.sender).transfer(amt);
        return amt;
    }
}

/// The property lives in a spec harness, so the production contract carries no assert
contract BankSpec is Bank {
    function spec(uint256 amt, uint256 fee) external {
        uint256 owned = balances[msg.sender];
        uint256 paid = withdraw(amt, fee);
        assert(paid <= owned);                        
    }
}
