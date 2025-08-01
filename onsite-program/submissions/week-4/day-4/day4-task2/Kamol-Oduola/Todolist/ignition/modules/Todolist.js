// ignition/modules/Todolist.js
const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const TodolistModule = buildModule("TodolistModule", (m) => {
  const todolist = m.contract("TodoList"); // ✅ Case-sensitive match
  return { todolist };
});

module.exports = TodolistModule;
