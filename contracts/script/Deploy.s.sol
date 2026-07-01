// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {RelayPolicy} from "../src/RelayPolicy.sol";

/// @notice Deploy RelayPolicy to Arbitrum Sepolia.
/// Usage:
///   forge script contracts/script/Deploy.s.sol \
///     --rpc-url $ARB_SEPOLIA_RPC --broadcast --verify \
///     --etherscan-api-key $ARBISCAN_KEY
contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address agent = vm.envAddress("AGENT_ADDRESS");

        vm.startBroadcast(pk);
        RelayPolicy policy = new RelayPolicy(agent);
        vm.stopBroadcast();

        console.log("RelayPolicy deployed at:", address(policy));
        console.log("Owner (guardian):", policy.owner());
        console.log("Agent:", policy.agent());
    }
}
