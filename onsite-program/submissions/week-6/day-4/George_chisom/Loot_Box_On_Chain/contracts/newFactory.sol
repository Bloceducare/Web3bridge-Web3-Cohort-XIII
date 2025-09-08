// SDPX-License-Identifier: Unlicense

pragma solidity ^0.8.28;

contract Real {

    struct New {
        uint256 id;
        string name;
    }

    New[] arrayNew;

    function register (uint256 _id, string memory _name) external {
        New memory news_ = New(_id, _name);
        arrayNew.push(news_);
    }

    function getRegister() external view returns (uint256) {
        return arrayNew.length;
    }
}

// contract VeryReal {

//     Real newReal;
    
//     function createFactory () public {
//         assembly {
//             veryNew: create:= (0,  )
//         }
//     }
// }

// assembly{create(0, )}