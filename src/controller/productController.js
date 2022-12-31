const productModel = require("../model/productModel")
const aws = require("../aws/aws")
const moment = require('moment')

const { isValidBody, isValidTitle, isValid, isValidPrice, isValidName, isValidNumbers, isValidFile, isValidId, isValidAvailableSizes } = require("../validation/validation")

//--------------------------------------------- Create Product --------------------------------------------//

exports.createProduct = async function (req, res) {

  try {
    let data = req.body

    let {title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments} = data

    if (!isValidBody(data)) {
      return res.status(400).send({status: false,message: "Please provide data in body"})
    }

    if (!title) 
      return res.status(400).send({ status: false, message: "Title is required" })

    if (!isValidTitle(title)) {
      return res.status(400).send({ status: false, message: "Title is invalid" })
    }

    let titleCheck = await productModel.findOne({ title: title })
    if (titleCheck)
      return res.status(400).send({status: false,message: "This title already exists"})

    if (!description)
      return res.status(400).send({ status: false, message: "Description is required!" })

    if (!isValid(description)) {
      return res.status(400).send({ status: false, msg: "descritions is invalid" })
    }

    if (!price)
      return res.status(400).send({ status: false, message: "Price is required!" })

    if (!isValidPrice(price)) {
      return res.status(400).send({ status: false, msg: "Price is invalid!" });
    }

    if (!currencyId)
      return res.status(400).send({ status: false, message: "Currency Id is required" })

    if (currencyId != "INR")
      return res.status(400).send({status: false,msg: "Currency will be in INR"})

    if (!currencyFormat)
      return res.status(400).send({ status: false, message: "Currency Format is required!" })

    if (currencyFormat != "₹")
      return res.status(400).send({status: false, message: "Please provide the currencyformat as ₹"})

    if (isFreeShipping) {
      if (!(isFreeShipping == "true" || isFreeShipping == "false")) {
        return res.status(400).send({status: false, message: "isFreeShipping should either be True or False"})
      }
    }

    let files = req.files

    if (files && files.length > 0) {

      if (!isValidFile(files[0].originalname))
      return res.status(400).send({ status: false, message: 'Enter format jpeg/jpg/png only' })

      let uploadedFileURL = await aws.uploadFile(files[0])

      data.productImage = uploadedFileURL
    }

    else {
      return res.status(400).send({ message: "Product Image is required" })
    }

    if (!isValidName(style)) {
      return res.status(400).send({ status: false, msg: "Style is invalid" });
    }


    if (availableSizes) {
      availableSizes = availableSizes.split(",").map((x) => x.trim())
      data.availableSizes = availableSizes

      if (!isValidAvailableSizes(availableSizes))
        return res.status(400).send({status: false,message: "Available sizes are XS,S,M,L,X,XXL,XL, please enter available size"})
    }

    if(installments || installments == ''){
      if (!isValid(installments) || !isValidNumbers(installments)) {
        return res.status(400).send({ status: false, message: "Installment is invalid" });
      }
    }

    const productCreate = await productModel.create(data);
    res.status(201).send({ status: true, message: "Success", data: productCreate })
  } 
  catch (err) {
    res.status(500).send({ staus: false, message: err.message });
  }
}

//--------------------------------------------- GET Product By Query --------------------------------------------//

exports.getProduct = async function (req, res) {

  try {

    let data = req.query

    let { size, name, priceGreaterThan, priceLessThan, priceSort } = data

    if (!isValidBody(data)) {
      let allData = await productModel.find({isDeleted:false})
      return res.status(200).send({status: true, data:allData})
    }

    const filter = {}

    filter["isDeleted"] = false

    if (size || size =='') {
      let newsize = size.split(",").map((x) => x.trim())
      if (!isValidAvailableSizes(newsize))
        return res.status(400).send({status: false,message: "vailable sizes are XS,S,M,L,X,XXL,XL, please enter available size"})
      
      filter["availableSizes"] = size
    }

    if (name || name == '') {

      if (!isValidTitle(name))
        return res.status(400).send({ stastus: false, message: "Invalid naming format!" })
      let productByname = new RegExp(name, "g") //{ $regex : name} 

      filter["title"] = productByname
    }

    if (priceGreaterThan || priceGreaterThan == '') {
      if (!isValidPrice(priceGreaterThan))
        return res.status(400).send({status: false,message: "Invalid format"})

      filter["price"] = { $gt: priceGreaterThan }
    }

    if (priceLessThan || priceLessThan == '') {
      if (!isValidPrice(priceLessThan))
        return res.status(400).send({status: false,message: "Invalid priceLessThan price format"})

      filter["price"] = { $lt: priceLessThan }
    }

    if ( priceGreaterThan && priceLessThan ) {

      if ( priceGreaterThan == priceLessThan ) {
        filter["price"] = { $eq: priceGreaterThan }
      } else {
        filter["price"] = { $gt: priceGreaterThan, $lt: priceLessThan }
      }
    }

    if (priceSort || priceSort == '') {

      if (priceSort == 1) {
        let productSort = await productModel.find(filter).sort({ price: 1 })
        if (!productSort) {
          return res.status(400).send({status: false,message: "Data not found"})
        }
        return res.status(200).send({ status: true, message:"Success", data:productSort })
      } 

      if (priceSort == -1) {
        let newproductSort = await productModel.find(filter).sort({ price: -1 })
        if (!newproductSort) {
          return res.status(404).send({status: false,message: "No data found that matches your search1"})
        }
        return res.status(200).send({ status: true, message: "Success", data:newproductSort })
      }
      return res.status(400).send({status:false, message: "Please Provide correct data, you can enter only 1 or -1"})
    }

   

    const finaldata = await productModel.find(filter)

    if (finaldata.length == 0) {
      return res.status(404).send({status: false,message: "No data found"})
    }

    return res.status(200).send({ status: true, message: "Success", data: finaldata })
  } 
  catch (error) {
    res.status(500).send({ message: error.message })
  }
}


//-------------------------------------- Get Product By Id --------------------------------------//


exports.getProductById = async function (req, res) {

    try {

      let productId = req.params.productId;
  
      if (!isValidId(productId)) 
        return res.status(400).send({ status: false, message: "ProductId is not valid" })
      
      let productData = await productModel.findOne({ _id: productId,isDeleted: false})
      if (!productData) {
        return res.status(404).send({ status: false, message: "Product not exist" })
      }
  
      return res.status(200).send({ status: true, message: "Success", data: productData })
    } 
    
    catch (err) {
      return res.status(500).send({ satus: false, err: err.message });
    }
  }


  //-------------------------------------- Update Product --------------------------------------//

  exports.updateProduct = async function (req, res) {
    try {
      let data = req.body
      let productId = req.params.productId
      let files = req.files
      let update = {}
  
      let { title, description, price, isFreeShipping, style, availableSizes, installments } = data
  
      if (!isValidBody(data)) {
        return res.status(400).send({status: false,message: "Please provide data in body"})
      }

      if (!isValidId(productId)) {
        return res.status(400).send({ status: false, msg: "ProductId is not valid" })
      }
  
      if (title || title == '') {
        if (!isValidTitle(title)) {
          return res.status(400).send({ status: false, message: "title is invalid" })
        }
      
        const uniquetitle = await productModel.findOne({ title: title });
        if (uniquetitle) {
          return res.status(400).send({ status: false, message: "title is already present" })
        }
        update["title"] = title
      }
  
      if (description || description == '') {
        if (!isValid(description)) {
          return res.status(400).send({ status: false, message: "description is invalid" });
        }
        update["description"] = description
      }
  
      if (price || price == '') {
        if (!isValidPrice(price)) {
          return res.status(400).send({ status: false, message: "Price is invalid!" })
        }
        update["price"] = price
      }
  
      if (files && files.length > 0) {

        if (!isValidFile(files[0].originalname))
        return res.status(400).send({ status: false, message: "Enter formate jpeg/jpg/png only" })
  
        let uploadedFileURL = await aws.uploadFile(files[0])
  
        update["productImage"] = uploadedFileURL
  
      } 
      else if (Object.keys(data).includes("productImage")) {
        return res.status(400).send({ status: false, message: "please put the productImage" })
      }
  
      if (style || style == '') {

        if (!isValidName(style)) {
          return res.status(400).send({ status: false, message: "Style is invalid!" })
        }
        update["style"] = style;
      }
  
      if (installments || installments == '') {

        if (!isValidNumbers(installments)) {
          return res.status(400).send({status: false,message: "Installments should be a Number only"})
        }
        update["installments"] = installments
      }
  
      if (availableSizes || availableSizes == '') {
        availableSizes = availableSizes.split(",").map((x) => x.trim());
        if (!isValidAvailableSizes(availableSizes))
          return res.status(400).send({status: false,message: "availableSizes is required or put valid sizes"})
          update["availableSizes"] = availableSizes 
      }
  
      if (isFreeShipping || isFreeShipping == '') {
        if (!(isFreeShipping == "true" || isFreeShipping == "false")) {
          return res.status(400).send({status: false,message: "isFreeShipping should either be True, or False"})
        }
        update["isFreeShipping"] = isFreeShipping
      }
  
    
  
      let updateProduct = await productModel.findOneAndUpdate(
        { _id: productId, isDeleted: false },
        { $set: update },
        { new: true }
      )

      if (!updateProduct) {
        return res.status(404).send({ status: false, message: "Product not found!" })
      }
  
      return res.status(200).send({status: true,message: "Product successfully updated",data: updateProduct})
    } 
    catch (error) {
      res.status(500).send({ status: false, err: error.message })
    }
  }

  //-------------------------------------- Delete Product --------------------------------------//

exports.deleteProduct = async function (req, res) {

    try {

      let productId = req.params.productId
  
      if (!isValidId(productId)) {
        return res.status(400).send({ status: false, message: "ProductId not valid" })
      }
  
      let productData = await productModel.findOne({ _id: productId,isDeleted: false})
      if (!productData) {
        return res.status(404).send({ status: false, message: "Product not exist" })
      }
  
      await productModel.updateOne(
        { _id: productId },
        { isDeleted: true, deletedAt:moment().format("dddd, MMMM Do YYYY, h:mm:ss") }
      );
  
      return res.status(200).send({ status: true, message: "Product Successfully Deleted" })
    } 
    catch (err) {
      return res.status(500).send({ satus: false, err: err.message })
    }
  }
  