const mongoose = require("mongoose");

const isValidBody = function (data) {
    return Object.keys(data).length > 0
  }

const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true;
}

const isValidPassword = function (password) {
  return /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,15}$/.test(password)
}

const isValidUserName = function (name) {
  if (/^([a-zA-Z]+\s)*[a-zA-Z]+$/.test(name)) return true;
  return false;
}

const isValidMobileNumber = function (number) {
  if (/^[6-9]\d{9}$/gi.test(number)) return true;
  return false;
}

const isValidId = function (id) {
  return mongoose.Types.ObjectId.isValid(id);
}

const isValidPincode = function (pincode){
  return /^[1-9][0-9]{5}$/.test(pincode);
}

const isValidEmail = function (mail) {
  if (/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(mail)) 
    return true
}

const isValidFile = (img) => {
  const regex = /(\/*\.(?:png|gif|webp|jpeg|jpg))/.test(img)
  return regex
}

const isValidName = function (name) {
  if (/^([a-zA-Z0-9]+\s)*[a-zA-Z0-9]+$/.test(name)) return true
  return false
}

const isValidPrice = (value) => {
  const regEx =/^[1-9]\d{0,8}(?:\.\d{1,2})?$/
  const result = regEx.test(value)
  return result
}

const isValidTitle = function (name) {
  if (/^([a-zA-Z0-9:-]+\s)*[a-zA-Z0-9:-]+$/.test(name)) return true
  return false
}

const isValidNumbers = function (value){
  let user = /^[0-9]+$/.test(value)
  return user
}

const isValidAvailableSizes = (availablesizes) => {
  for( i=0 ;i<availablesizes.length; i++){
    if(!["S", "XS","M","X", "L","XXL", "XL"].includes(availablesizes[i])) return false
  }
  return true
}

module.exports = { isValidBody, isValid, isValidPassword, isValidUserName, isValidMobileNumber, isValidId,isValidPincode, isValidEmail, isValidFile, isValidName, isValidPrice, isValidTitle, isValidNumbers, isValidAvailableSizes }