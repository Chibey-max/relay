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

    function test_autoEnrollsFirstTimeRecipientUnderDefaults() public {
        vm.prank(agent);
        policy.checkAndRecord(recipient, 5 ether);

        RelayPolicy.Limit memory l = policy.getLimit(recipient);
        assertTrue(l.whitelisted);
        assertEq(l.perTxMaxWei, 100 ether);
        assertEq(l.dailyMaxWei, 500 ether);
        assertEq(l.spentToday, 5 ether);
    }

    function test_rejectsOverPerTxDefault() public {
        vm.prank(agent);
        vm.expectRevert(
            abi.encodeWithSelector(RelayPolicy.OverPerTxLimit.selector, recipient, 200 ether, 100 ether)
        );
        policy.checkAndRecord(recipient, 200 ether);
    }
}
