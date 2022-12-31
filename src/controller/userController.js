const userModel = require("../model/userModel")
const bcrypt = require("bcrypt")
const aws = require("../aws/aws")
const jwt = require("jsonwebtoken")


const { isValidBody, isValid, isValidPassword, isValidUserName, isValidMobileNumber, isValidName, isValidId, isValidPincode, isValidEmail, isValidFile } = require("../validation/validation")


/* ------------------------------------------- Create User --------------------------------------------------- */

exports.creatUserData = async function (req, res) {

    try {

      let data = req.body
  
      const { fname, lname, email, phone, password } = data

       
      if (!isValidBody(data)) {
        return res.status(400).send({status: false,message: "Please provide data in body"})
      }
  
      if (!fname) {
       return res.status(400).send({ status: false, message: "First Name is required" })
      }

      if (!isValid(fname) || !isValidUserName(fname)) {
        return res.status(400).send({ status: false, message: "First name is invalid" })
      }
  
      if (!lname){
        return res.status(400).send({ status: false, message: "Last Name is required" })
        }

      if (!isValid(lname) || !isValidUserName(lname)) {
        return res.status(400).send({ status: false, message: "Last name is invalid" })
      }
  
      if (!email) {
        return res.status(400).send({ status: false, message: "Email is required" })
      }

      if (!isValidEmail(email)) {
        return res.status(400).send({ status: false, message: "Email is invalid" })
      }

      let userEmail = await userModel.findOne({ email: email })
      if (userEmail){
        return res.status(400).send({status: false,message:"Email Id already registered, Please provide another email"})
          }
  
      if (!phone){
        return res.status(400).send({ status: false, message: "Phone number is required!" })
        }

      if (!isValidMobileNumber(phone)) {
        return res.status(400).send({ status: false, message: "Phone is invalid"})
      }

      let userNumber = await userModel.findOne({ phone: phone })
      if (userNumber) {
        return res.status(400).send({status: false,message:"phone number is already registered, please provide another mobile number"})
       }
  
      if (!password){
        return res.status(400).send({ status: false, message: "Password is required!" })
      }

      if (!isValidPassword(password)) {
        return res.status(400).send({status: false,message:"Password should be of 8 to 15 characters and it should contain one Uppercase, one lower case and Number Ex - AbhisheK12345,Qwe#121"})
      }

      const salt = await bcrypt.genSalt(10);
      // console.log(salt)

      data.password = await bcrypt.hash(data.password, salt);
      // console.log(data.password)

      let address = data.address

      if (!address){
        return res.status(400).send({ status: false, message: "Address is required" })
        }
        
        address=JSON.parse(address)

        if(!address.shipping){
          return res.status(400).send({ status: false, message: "Shipping is required!" })
        }
  
      if (!address.shipping.street){
        return res.status(400).send({ status: false, message: "Shipping Street is required!" })
      }
        
      if (!isValidName(address.shipping.street)) {
        return res.status(400).send({ status: false, message: "Invalid shipping street" })
      }
  
      if (!address.shipping.city){
        return res.status(400).send({ status: false, message: "Shipping City is required" })
      }
        
      if (!isValidName(address.shipping.city)) {
        return res.status(400).send({ status: false, message: "Invalid shipping city!" })
      }
  
      if (!address.shipping.pincode){
        return res.status(400).send({ status: false, message: "Shipping Pincode is required!" })
      }

      if (!isValidPincode(address.shipping.pincode)) {
        return res.status(400).send({ status: false, message: "Invalid shipping pincode!" })
      }

      if(!address.billing){
        return res.status(400).send({ status: false, message: "Billing is required!" })
      }
  
      if (!address.billing.street){
        return res.status(400).send({ status: false, message: "Billing Street is required!" })
      }
        
      if (!isValidName(address.billing.street)) {
        return res.status(400).send({ status: false, message: "Invalid billing street!" })
      }
  
      if (!address.billing.city){
        return res.status(400).send({ status: false, message: "Billing City is required!" })
      }

      if (!isValidName(address.billing.city)) {
        return res.status(400).send({ status: false, message: "Invalid billing city!" })
      }
  
      if (!address.billing.pincode){
        return res.status(400).send({ status: false, message: "Billing Pincode is required!" })
      }

      if (!isValidPincode(address.billing.pincode)) {
        return res.status(400).send({ status: false, message: "Invalid billing pincode!" })
      }
 

                              // -------------- AWS ------------- //
  
      let files = req.files

      if (files && files.length > 0) {

        if (!isValidFile(files[0].originalname)){

          return res.status(400).send({ status: false, message: `Enter format jpeg/jpg/png only.` })
          }

        let uploadedFileURL = await aws.uploadFile(files[0])
        // console.log(files[0])
        // console.log(files[0].originalname)
        data.profileImage = uploadedFileURL
      } 
      else {
        return res.status(400).send({ message: "Files are required!" })
      }

  /* -------------------------------------------------------------------------------------------------------- */

      data.address = address
      const userDataCreate = await userModel.create(data)

      return res.status(201).send({status: true, message: "User created successfully",data: userDataCreate})
    } 
    catch (error) {
      res.status(500).send({ message: error.message });
    }
  }


/* ------------------------------------------- Login User --------------------------------------------------- */

exports.loginUser = async function (req, res) {

  try {

    let email = req.body.email
    let password = req.body.password


    if (!email || !password) {
      return res.status(400).send({ status: false, message: "Please provide email and password" })
      }

    if (!isValidEmail(email)) {
      return res.status(400).send({ status: false, message: "Email is invalid!" })
    }

    if (!isValidPassword(password)) {
      return res.status(400).send({status: false,message:"Password should be of 8 to 15 characters and it should contain one Uppercase, one lower case and Number Ex - AbhisheK12345,Qwe#121"})
    }

    let checkEmail = await userModel.findOne({ email: email })

    if (!checkEmail) {
      return res.status(401).send({ status: false, message: "User is not registered"})
    }

    let encryptPwd = checkEmail.password

    await bcrypt.compare(password, encryptPwd, function (err, result) {

      if (result) {

        let token = jwt.sign(
          { _id: checkEmail._id.toString() },
          "Group-20",
          { expiresIn: "30m"}
        )
         console.log(token)
        return res.status(201).send({status: true,message: "User login successfull",data: { userId: checkEmail._id, token: token }})
      } 
      else {
        return res.status(401).send({ status: false, message: "Please Provide correct password" })
      }
    })

  } catch (err) {
    res.status(500).send({ staus: false, message: err.message });
  }
}

/* ----------------------------------------- Get User Data --------------------------------------------------- */

exports.getUserData = async function(req,res){

    try{
        let userId = req.params.userId

        if (!isValidId(userId)) {
          return res.status(400).send({ status: false, message: "Invalid userId" });
        }

        let userData = await userModel.findById(userId)
        if(!userData){
            return res.status(404).send({status:false,msg:"User not found"})
        }

        let data = {
            address:userData.address,
            _id:userData._id,
            fname:userData.fname,
            lname:userData.lname,
            email:userData.email,
            profileImage:userData.profileImage,
            phone:userData.phone,
            password:userData.password,
            createdAt:userData.createdAt,
            updatedAt:userData.updatedAt,
            __v:userData.__v
        }
        return res.status(200).send({status:true,message:"User profile details",data:data})

    } catch(err){
        return res.status(500).send({status:false,message:err.message})
    }
}


/* ----------------------------------------- Edit User Data --------------------------------------------------- */

exports.updateProfile = async function (req, res) {

  try {

    const data = req.body
    const userId = req.params.userId
    const files = req.files
    const update = {}

    const { fname, lname, email, phone, password } = data

    if (!isValidBody(data) && !files) {
      return res.status(400).send({status: false,message: "Please provide data in body"})
    }

    if (fname || fname == '') {
      if (!isValid(fname) || !isValidUserName(fname)) {
        return res.status(400).send({ status: false, message: "fname is invalid" })
      }
      update["fname"] = fname 
    }

    if (lname || lname == '') {
      if (!isValid(lname) || !isValidUserName(lname)) {
        return res.status(400).send({ status: false, message: "lname is invalid" })
      }
      update["lname"] = lname; 
    }

    if (email || email == '') {
      if (!isValidEmail(email)) {
        return res.status(400).send({ status: false, message: "Email is invalid" })
      }

      let userEmail = await userModel.findOne({ email: email })
      if (userEmail) {
        return res.status(409).send({status: false,message:"This email is already registered"})
      }
      update["email"] = email;
    }

    if (phone || phone == '') {
      if (!isValidMobileNumber(phone)) {return res.status(400).send({ status: false, message: "Phone is invalid" })
      }

      let userNumber = await userModel.findOne({ phone: phone })
      if (userNumber){
        return res.status(409).send({status: false,message:"This phone number already registered"})
       }
      update["phone"] = phone
    }

    if (password || password == '') {
      if (!isValidPassword(password)) {
        return res.status(400).send({status: false,message:"Password should be of 8 to 15 characters and it should contain one Uppercase, one lower case, and Number, Ex - Abhishek@12345,Qwe#121"})
      }

      const salt = await bcrypt.genSalt(10)
      data.password = await bcrypt.hash(data.password, salt)

      let encryptPassword = data.password
      update["password"] = encryptPassword
    }

    let address = data.address

    if (address || address == '') {

      address=JSON.parse(address)

      let { shipping, billing } = address

      if (shipping || shipping == '') {
        let { street, city, pincode } = shipping

        if (street || street =='') {
          if (!isValidName(address.shipping.street)) {
            return res.status(400).send({ status: false, message: "Invalid shipping street" })
          }
          update["address.shipping.street"] = street
        }

        if (city || city == '') {
          if (!isValidName(address.shipping.city)) {
            return res.status(400).send({ status: false, message: "Invalid shipping city" })
          }
          update["address.shipping.city"] = city
        }

        if (pincode || pincode == '') {
          if (!isValidPincode(address.shipping.pincode)) {
            return res.status(400).send({ status: false, message: "Invalid shipping pincode" })
          }
          update["address.shipping.pincode"] = pincode
        }
      }

      if (billing || billing == '') {
        let { street, city, pincode } = billing;

        if (street || street == '') {
          if (!isValidName(address.billing.street)) {
            return res.status(400).send({ status: false, message: "Invalid billing street" })
          }
          update["address.billing.street"] = street
        }

        if (city || city == '') {
          if (!isValidName(address.billing.city)) {
            return res.status(400).send({ status: false, message: "Invalid billing city" })
          }
          update["address.billing.city"] = city
        }

        if (pincode || pincode == '') {
          if (!isValidPincode(address.billing.pincode)) {
            return res.status(400).send({ status: false, message: "Invalid billing pincode" })
          }
          update["address.billing.pincode"] = pincode
        }
      }

      console.log(address)
    }
    

    if (files && files.length > 0) {

      if (!isValidFile(files[0].originalname)){
        return res.status(400).send({ status: false, message: `Enter format should be in jpeg/jpg/png only` })
      }

      let uploadedFileURL = await aws.uploadFile(files[0])
      console.log(uploadedFileURL)

      update["profileImage"] = uploadedFileURL
    }

    else if (Object.keys(data).includes("profileImage")) {
      return res.status(400).send({ status: false, message: "please put the profileimage" });
    }

    const updateUser = await userModel.findOneAndUpdate(
      { _id: userId },
      {$set:update},
      { new: true }
    )

    return res.status(200).send({status: true,message: "user profile successfully updated",data: updateUser})
  } 
  catch (error) {
    res.status(500).send({status:false, message: error.message })
  }
}