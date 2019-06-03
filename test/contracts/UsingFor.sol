pragma solidity ^0.5.0;


library Roles {
  struct Role {
    mapping (address => bool) bearer;
  }

  function add(Role storage role, address account) internal {
    role.bearer[account] = true;
  }
}


contract MinterRole {
  using Roles for Roles.Role;

  Roles.Role private _minters;

  function addMinter(address account) public {
    _minters.add(account);
  }
}

