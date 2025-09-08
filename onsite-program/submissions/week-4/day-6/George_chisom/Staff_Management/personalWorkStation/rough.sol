// EmployeeManagement[] public EmployeeFactory;


    // function register_factory_employee () external {

    //     EmployeeManagement _newEmployee = new EmployeeManagement();

    //     // _newEmployee.transferOwnership(msg.sender);


    //     address new_address = address(_newEmployee);

    //     // EmployeeFactory.push(_newEmployee);

    //     FactoryAddress.push(new_address);

    // }




    // function update_factory_salary (uint _index, address _employeeAddress) external {

    //     EmployeeManagement employeeManagement = EmployeeManagement(FactoryAddress[_index]);

    //     employeeManagement.update_salary(_employeeAddress);
        
    // }

    // function pay_factory_salary (uint _index, address payable _to, uint amount) external {
    //     EmployeeManagement new_pay_ = EmployeeManagement(FactoryAddress[_index]);

    //     new_pay_.pay_salary(_to, amount);

    // }

    // function get_a_balance (uint _index, address _employee_address) external view returns (uint) {
    //     EmployeeManagement new_balance_ = EmployeeManagement(FactoryAddress[_index]);

    //     return new_balance_.get_balance(_employee_address);
    // }

    // function get_an_employee (uint _index, address _employee_address) external view returns (address) {
        
    //     EmployeeManagement new_employee = EmployeeManagement(FactoryAddress[_index]);

    //     address new_address = address(new_employee);

    //     return new_address;
    // }