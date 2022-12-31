const jwt = require("jsonwebtoken");
const userModel = require("../model/userModel");
const { isValidId } = require("../validation/validation");


/* ---------------------------------------- Authentication ----------------------------------------- */

const authenticate = function (req, res, next) {

  try {

    let token = req.headers["authorization"]

    console.log(token)

    if (!token)
      return res.status(400).send({ status: false, message: "token is required" })

    token = token.split(" ")
    
    console.log(token)

    jwt.verify(token[1], "Group-20", function (error, decodedtoken) {

    console.log(token[1])
    
      if (error){
        return res.status(401).send({ status: false, message: error.message })
      }

      req["decodedtoken"] = decodedtoken
      console.log(decodedtoken)
      next()

    })
    
  } 
  catch (error) {
    return res.status(500).send({status:false, message: error.message })
  }
}

/* ---------------------------------------- Authorization ----------------------------------------- */

const authorisation = async function (req, res, next) {

  try {

    let userId = req.params.userId

    if (!isValidId(userId)) {
        return res.status(400).send({ status: false, message: "Invalid userId" });
      }

    let findUserId = await userModel.findById(userId )

    if (!findUserId) {
      return res.status(404).send({ status: false, message: "User not found"})
    }

    let newUserId = findUserId._id
    let id = req.decodedtoken._id

    if (id != newUserId){
      return res.status(403).send({status: false,message: "You are not authorised to perform this task"})
      }

    next()
  } 

  catch (error) {
    return res.status(500).send({status:false, message: error.message })
  }
}

module.exports = { authenticate, authorisation }