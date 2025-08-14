<<<<<<< Updated upstream
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {Counter} from "../src/Counter.sol";

contract CounterTest is Test {
    Counter counter;

    function setUp() public {
        counter = new Counter();
    }

    function testSetCount() public {
        counter.setNumber(0);
        assertEq(counter.getNumber(), 0);
    }

    function testIncrement() public {
        counter.increment();

        assertEq(counter.getNumber(), 1);
    }

    function testAnotherIncrement() public {
        testIncrement();
        counter.increment();

        assertEq(counter.getNumber(), 2);
    }
}
=======
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {Counter} from "../src/Counter.sol";

contract CounterTest is Test {
    Counter public counter;

    function setUp() public {
        counter = new Counter();
        counter.setNumber(0);
    }

    function test_Increment() public {
        counter.increment();
        assertEq(counter.number(), 1);
    }

    function testFuzz_SetNumber(uint256 x) public {
        counter.setNumber(x);
        assertEq(counter.number(), x);
    }
}
>>>>>>> Stashed changes
