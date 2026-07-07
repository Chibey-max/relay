// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {RelayPolicy} from "../src/RelayPolicy.sol";

contract RelayPolicyTest is Test {
    RelayPolicy policy;
    address owner = address(this);
    address agent = address(0xA6E17);
    address recipient = address(0xBEEF);

    function setUp() public {
        policy = new RelayPolicy(agent, 100 ether, 500 ether);
    }
}
