// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

contract Web3Access {
    enum staff {
        mentor,
        mediaTeam,
        managers,
        socialMediaTeam,
        technicalSupervisors,
        kitchenStaff
    }

    address public owner;

    struct Web3Staffs {
        address staff_address;
        uint uid;
        string name;
        staff all_staff;
        bool isWorking;
    }

    error ACCESS_DENIED();


    Web3Staffs[] public All_Employed_Staffs;

    mapping (address => Web3Staffs) Total_Staff;

    constructor () {
        owner = msg.sender;
    }

    uint private unique_id;

    // function to add staff to data
    function add_staff (address _staff_address, string memory _name, staff _all_Staff) external {
        unique_id = unique_id + 1;
        
        Web3Staffs memory _incoming_staff = Web3Staffs( _staff_address, unique_id, _name, _all_Staff, true );

        Total_Staff[_staff_address] = _incoming_staff;

        All_Employed_Staffs.push(_incoming_staff);

    }

    function update_staff (uint _uid, string memory _name, address _staff_address, staff _all_Staff) external {
        for (uint i; i < All_Employed_Staffs.length; i++) {
            if (_uid == All_Employed_Staffs[i].uid - 1) {
                All_Employed_Staffs[i].name = _name;
                All_Employed_Staffs[i].staff_address = _staff_address;
            }
        }


        Web3Staffs memory _incoming_staff = Web3Staffs( _staff_address, _uid, _name, _all_Staff, true );

        Total_Staff[_staff_address] = _incoming_staff;

        All_Employed_Staffs.push(_incoming_staff);

    }

    function admin_update_staff (address _staff_address, uint _uid, string memory _name, staff _all_Staff, bool _isWorking) external {
        if (_staff_address != owner) {
            revert ACCESS_DENIED();
        }

        for (uint i; i < All_Employed_Staffs.length; i++) {
            if (_uid == All_Employed_Staffs[i].uid - 1 ) {
                All_Employed_Staffs[i].name = _name;
                All_Employed_Staffs[i].all_staff = _all_Staff;
                All_Employed_Staffs[i].isWorking = _isWorking;
            }
        }

        Web3Staffs memory _incoming_staff = Web3Staffs( _staff_address, _uid, _name, _all_Staff, _isWorking );

        Total_Staff[_staff_address] = _incoming_staff;

        All_Employed_Staffs.push(_incoming_staff);
    }

    function admin_staff_dismissal(address _address, uint _uid) external {
        if (_address != owner) {
            revert("ACCESS_DENIED");
        }
        
        // Check if _uid is valid before accessing array
        if (_uid >= All_Employed_Staffs.length) {
            revert("INVALID_UID");
        }

        // Directly update the staff member at index _uid
        All_Employed_Staffs[_uid].isWorking = false;
    }

    function grant_access (address _address) external view returns (bool isWorking) {

        Web3Staffs memory _access_staff = Total_Staff[_address];

        if (!_access_staff.isWorking) {
            return false;
        }
        if (_access_staff.all_staff == staff.mentor || _access_staff.all_staff == staff.managers || _access_staff.all_staff == staff.mediaTeam) {
            return true;
        }

    }

    function get_one_staff(address staff_address) external view returns (Web3Staffs memory) {
        return Total_Staff[staff_address];
    }

    function get_all_staff() external view returns (Web3Staffs[] memory) {
        return All_Employed_Staffs;
    }
}