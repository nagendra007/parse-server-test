
//var stripe=new Stripe("sk_test_n2S4djhAGVIPM8C2oQuNzPF8");
var braintree = require("braintree");
var gateway = braintree.connect({
    environment: braintree.Environment.Sandbox,
    merchantId: "bt9cmxxgmv9smhng",
    publicKey: "5rsr9yzrgp7ztmbz",
    privateKey: "31e804049ca424d8c0ffcf31cf2a86e5"
});

Parse.Cloud.define('hello', function(req, res) {
  res.success('Hi Singh test');
});

Parse.Cloud.define("braintreepay", function (request, response) {
    if (request.params.userid != null && request.params.userid != "" && request.params.BTcustomerid != null && request.params.BTcustomerid != "" && request.params.BTcardid != null && request.params.BTcardid != "" && request.params.amount != null && request.params.amount != "" && request.params.toolTakenForRentID != null && request.params.toolTakenForRentID != "") {
        var user = new Parse.User();
        user.id = request.params.userid;
        var query = new Parse.Query("userDetails");
        query.include('user');
        query.equalTo("user", user);
        query.find({
            success: function (results) {
                if (results.length > 0) {

                    gateway.transaction.sale({
                        amount: request.params.amount,
                        //paymentMethodNonce: request.params.nonce,
                        CustomerId: request.params.BTcustomerid,// balcustomerid,
                        PaymentMethodToken: request.params.BTcardid,
                        options: {
                            submitForSettlement: true
                        }
                    }, function (err, result) {
                        if (result.success == true) {

                            //var ToolTakenForRent = Parse.Object.extend("toolTakenForRent");
                            //var toolTakenForRent = new ToolTakenForRent();
                            //toolTakenForRent.id = request.params.toolTakenForRentID;

                            var UserPayment = Parse.Object.extend("userPayment");
                            var userPayment = new UserPayment();
                            userPayment.set("user", user);
                            userPayment.set("txnId", result.transaction.id);
                            userPayment.set("amount", result.transaction.amount);
                            userPayment.save(null, {
                                success: function (userPayment) {
                                    response.success(userPayment);
                                },
                                error: function (error) {
                                    response.error("error in adding card in collection");
                                }
                            });
                           
                        }
                        else {
                            response.error(err);
                        }
                    });
                }
                else {
                    response.error("User not found");
                }
            },
            error: function (error) {
                response.error("Error: " + error.code + " " + error.message);
            }
        });
    }
    else {
        response.error("all Params are required");
    }
});

Parse.Cloud.define("addBraintreeCreditCard", function (request, response) {
    if (request.params.userid != null && request.params.userid != "" && request.params.CardholderName != null && request.params.CardholderName != "" && request.params.Number != null && request.params.Number != "" && request.params.CVV != null && request.params.CVV != "" && request.params.ExpirationMonth != null && request.params.ExpirationMonth != "" && request.params.ExpirationYear != null && request.params.ExpirationYear != "") {//if (request.params.nonce != null && request.params.nonce != "" ) {
        var user = new Parse.User();
        user.id = request.params.userid;
        var query = new Parse.Query("userDetails");
        query.include('user');
        query.equalTo("user", user);
        query.find({
            success: function (results) {
                if (results.length > 0) {
                    //gateway.customer.create({
                    //    firstName: request.params.firstName,//results[0].firstName,
                    //    lastName: request.params.lastName,// results[0].lastName,
                    //    email: results[0].email,
                    //    paymentMethodNonce: request.params.nonce,
                    
                    //}, function (err, result) {
                    //   // result.success;
                    //    // true

                    //   // result.customer.id;
                    //    // e.g. 494019
                    //    response.success( res=result,err=err );
                    //});
                    gateway.customer.create({
                        firstName: results[0].firstName,//results[0].firstName,
                        lastName: results[0].lastName,// results[0].lastName,
                        email: results[0].email,
                        //paymentMethodNonce: request.params.nonce,
                        CreditCard: {
                            CardholderName: request.params.CardholderName, //"my test",
                            Number: request.params.Number,//"4111111111111111",
                            CVV: request.params.CVV,//"123",
                            //ExpirationDate: "11/2022",
                            ExpirationMonth: request.params.ExpirationMonth,//"11",
                            ExpirationYear: request.params.ExpirationYear,//"2022",
                            Options: {
                                MakeDefault: true,
                                VerifyCard: true
                            }
                        }
                    }, function (err, result) {
                        if (result.success == true)
                        {
                            var BTcustomerid = result.customer.id;
                            var BTcardid = result.customer.creditCards[0].token;
                            var cardtype = result.customer.creditCards[0].cardType;
                            var maskedNumber = result.customer.creditCards[0].maskedNumber;

                            var UserCreditCardInfo = Parse.Object.extend("userCreditCardInfo");
                            var userCreditCardInfo = new UserCreditCardInfo();
                            userCreditCardInfo.set("user", user);
                            userCreditCardInfo.set("BTcustomerid", BTcustomerid);
                            userCreditCardInfo.set("BTcardid", BTcardid);
                            userCreditCardInfo.set("cardtype", cardtype);
                            userCreditCardInfo.set("maskedNumber", maskedNumber);
                            userCreditCardInfo.set("ExpirationMonth", request.params.ExpirationMonth);
                            userCreditCardInfo.set("ExpirationYear", request.params.ExpirationYear);
                            userCreditCardInfo.save(null, {
                                success: function (userCreditCardInfo) {
                                    response.success(userCreditCardInfo);
                                },
                                error: function (error) {
                                    response.error("error in adding card in collection");
                                }
                            });
                            
                        }
                        else {
                            response.error("error in adding card");
                        }
                        // result.success;
                        // true

                        // result.customer.id;
                        // e.g. 494019
                        
                    });

                    //response.success(results);
                }
                else {
                    response.error("User not found");
                }
            },
            error: function (error) {
                response.error("Error: " + error.code + " " + error.message);
            }
        });
    }
    else {
        response.error("all Params are required");
    }
});




Parse.Cloud.define("addUpdateUserdetails", function (request, response) {
    if (request.params.userid != null && request.params.userid != "") {
        var query = new Parse.Query(Parse.User);
        query.equalTo("objectId", request.params.userid);
        query.find({
            success: function (result) {
                if (result.length > 0) {

                    var user = new Parse.User();
                    user.id = request.params.userid;

                    var UserDetails = Parse.Object.extend("userDetails");
                    //var userDetails1 = new UserDetails();
                    var query = new Parse.Query(UserDetails);
                    query.equalTo("user", user);
                    query.find().then(function (userDetailss) {
                        var point = new Parse.GeoPoint(19.2403, 73.1305);
                        var myid = "";
                        if (userDetailss.length > 0) {
                            //response.success(userDetailss[0].id);
                            var myid = "";
                            myid = userDetailss[0].id;
                            //var UserDetails1 = Parse.Object.extend("userDetails");
                            var userDetails2 = new UserDetails();
                            userDetails2.id = myid;//"snlWbSHB1P";  //   userDetailss[0].id;//

                            if (request.params.firstName != null && request.params.firstName != "") {
                                userDetails2.set("firstName", request.params.firstName);
                            }
                            if (request.params.lastName != null && request.params.lastName != "") {
                                userDetails2.set("lastName", "");
                            }
                            if (request.params.dob != null && request.params.dob != "") {
                                userDetails2.set("dob", request.params.dob);
                            }
                            if (request.params.gender != null && request.params.gender != "") {
                                userDetails2.set("gender", request.params.gender);
                            }
                            if (request.params.imageURL != null && request.params.imageURL != "") {
                                userDetails2.set("imageURL", request.params.imageURL);
                            }
                            if (request.params.phoneNo != null && request.params.phoneNo != "") {
                                userDetails2.set("phoneNo", request.params.phoneNo);
                            }
                            if (request.params.altPhoneNo != null && request.params.altPhoneNo != "") {
                                userDetails2.set("altPhoneNo", request.params.altPhoneNo);
                            }
                            if (request.params.address != null && request.params.address != "") {
                                userDetails2.set("address", request.params.address);
                            }
                            if (request.params.city != null && request.params.city != "") {
                                userDetails2.set("city", request.params.city);
                            }
                            if (request.params.zipCode != null && request.params.zipCode != "") {
                                userDetails2.set("zipCode", request.params.zipCode);
                            }
                            if (request.params.state != null && request.params.state != "") {
                                userDetails2.set("state", request.params.state);
                            }
                            userDetails2.set("location", point);
                            userDetails2.save({
                                success: function (results) {
                                    response.success(results);
                                },
                                error: function (error) {
                                    response.error("Error: " + error.code + " " + error.message);
                                }
                            });
                            //userDetails2.save().then(function (results) {
                            //    response.success(results);
                            //},
                            //function (error) {
                            //    response.error("Error: " + error.code + " " + error.message);
                            //});

                            //response.success("already have");
                        }
                        else {
                            //var UserDetailstest = Parse.Object.extend("userDetails");
                            var userDetailstest = new UserDetails();
                            userDetailstest.id = myid;
                            if (request.params.email != null && request.params.email != "") {
                                userDetailstest.set("email", request.params.email);
                            }
                            if (request.params.firstName != null && request.params.firstName != "") {
                                userDetailstest.set("firstName", request.params.firstName);
                            }
                            if (request.params.lastName != null && request.params.lastName != "") {
                                userDetailstest.set("lastName", request.params.lastName);
                            }
                            if (request.params.dob != null && request.params.dob != "") {
                                userDetailstest.set("dob", request.params.dob);
                            }
                            if (request.params.gender != null && request.params.gender != "") {
                                userDetailstest.set("gender", request.params.gender);
                            }
                            if (request.params.imageURL != null && request.params.imageURL != "") {
                                userDetailstest.set("imageURL", request.params.imageURL);
                            }
                            //userDetails.set("imageName", parseFile);
                            userDetailstest.set("isVerified", "1");
                            userDetailstest.set("scanDocId", "");
                            if (request.params.phoneNo != null && request.params.phoneNo != "") {
                                userDetailstest.set("phoneNo", request.params.phoneNo);
                            }
                            if (request.params.altPhoneNo != null && request.params.altPhoneNo != "") {
                                userDetailstest.set("altPhoneNo", request.params.altPhoneNo);
                            }
                            if (request.params.address != null && request.params.address != "") {
                                userDetailstest.set("address", request.params.address);
                            }
                            if (request.params.city != null && request.params.city != "") {
                                userDetailstest.set("city", request.params.city);
                            }
                            if (request.params.zipCode != null && request.params.zipCode != "") {
                                userDetailstest.set("zipCode", request.params.zipCode);
                            }
                            if (request.params.state != null && request.params.state != "") {
                                userDetailstest.set("state", request.params.state);
                            }
                            userDetailstest.set("location", point);
                            userDetailstest.set("user", user);

                            userDetailstest.save().then(function (object) {
                                response.success(object);
                            },
                            function (error) {
                                response.error("Error: " + error.code + " " + error.message);
                            });

                            //response.success("Data saved");
                        }
                    });
                    //response.success("Data saved");
                }
                else {
                    response.error("user not found");
                }
            }
        });
    }
    else {
        response.error("please provide userid");
    }
});

Parse.Cloud.define("search", function (request, response) {
    if (request.params.latitude != null && request.params.latitude != "" && request.params.longitude != null && request.params.longitude != "" && request.params.miles != null && request.params.miles != "" && request.params.categoryId != null && request.params.categoryId != "" && request.params.subcategoryId != null && request.params.subcategoryId != "") {

       // var point = new Parse.GeoPoint(request.params.latitude, request.params.longitude);
        var point = new Parse.GeoPoint(18.2403, 73.1305);
        var UserDetails = Parse.Object.extend("userDetails");
        var userDetails = new UserDetails();
        var query = new Parse.Query(UserDetails);

        query.withinMiles("location", point, request.params.miles);
        if (request.params.userid != null && request.params.userid != "") {
            var user = new Parse.User();
            user.id = request.params.userid;
            query.notEqualTo("user", user);
        }
        query.find({
            success: function (userDetails) {
                if (userDetails.length > 0) {
                    var myusers = [];
                    for (var j = 0; j < userDetails.length; j++) {
                        myusers.push(userDetails[j].get("user"));
                    }
                    var ToolForRent = Parse.Object.extend("toolForRent");
                    var query = new Parse.Query(ToolForRent);
                    query.equalTo("isAvailable", "1");


                    var ToolCategory = Parse.Object.extend("toolCategory");
                    var toolcategory = new ToolCategory();
                    toolcategory.id = request.params.categoryId;
                    var ToolSubCategory = Parse.Object.extend("toolSubCategory");
                    var toolSubCategory = new ToolSubCategory();
                    toolSubCategory.id = request.params.subcategoryId;


                    query.equalTo("categoryId", toolcategory);
                    query.equalTo("subCategoryId", toolSubCategory);
                    query.containedIn("user", myusers);
                    query.include("categoryId");
                    query.include("subCategoryId");
                    query.find({
                        success: function (toolForRent) {
                            response.success(toolForRent);
                        },
                        error: function (error) {
                            response.error("error occured :" + errro.message);
                        }
                    });

                }
                else {
                    response.error("no users available in given radius");
                }
            },
            error: function (errro) {
                response.error("error occured :" + errro.message);
            }
        });
    }
    else {
        response.error("all Params are required");
    }
});


Parse.Cloud.define("getuserdetails", function (request, response) {
    if (request.params.userid != null && request.params.userid != "" ) {//if (request.params.nonce != null && request.params.nonce != "" ) {
        var user = new Parse.User();
        user.id = request.params.userid;
        var query = new Parse.Query("userDetails");
        query.include('user');
        query.equalTo("user", user);
        query.find({
            success: function (results) {
                    response.success(results);
            },
            error: function (error) {
                response.error("Error: " + error.code + " " + error.message);
            }
        });
    }
    else {
        response.error("please userid");
    }
});



Parse.Cloud.define("addTool", function (request, response) {
    if (request.params.userid != null && request.params.userid != "") {//if (request.params.nonce != null && request.params.nonce != "" ) {
        var query = new Parse.Query(Parse.User);
        query.equalTo("objectId", request.params.userid);  // find all the women
        query.find({
            success: function (result) {
                if (result.length > 0) {
                    var user = new Parse.User();
                    user.id = request.params.userid;

                    if (request.params.categoryId != null && request.params.categoryId != "" && request.params.subcategoryId != null && request.params.subcategoryId != "" && request.params.amount != null && request.params.amount != "" && request.params.desc != null && request.params.desc != "" && request.params.make != null && request.params.make != "" && request.params.moretimeallowed != null && request.params.moretimeallowed != "" && request.params.imageURL != null && request.params.imageURL != "" && request.params.toolName != null && request.params.toolName != "") {

                        var ToolCategory = Parse.Object.extend("toolCategory");
                        var toolCategory = new ToolCategory();
                        toolCategory.id = request.params.categoryId;

                        var ToolSubCategory = Parse.Object.extend("toolSubCategory");
                        var toolSubCategory = new ToolSubCategory();
                        toolSubCategory.id = request.params.subcategoryId;



                        var ToolForRent = Parse.Object.extend("toolForRent");
                        var toolForRent = new ToolForRent();

                        toolForRent.set("user", user);
                        toolForRent.set("toolName", request.params.toolName);
                        toolForRent.set("categoryId", toolCategory);
                        toolForRent.set("subCategoryId", toolSubCategory);
                        toolForRent.set("description", request.params.desc);
                        toolForRent.set("pricePerDay", request.params.amount);
                        toolForRent.set("isAvailable", "1");
                        toolForRent.set("isRented", "0");
                        toolForRent.set("toolImageURL", request.params.imageURL);
                        //toolForRent.set("toolImageName", "");
                        toolForRent.set("manufacturer", "none");
                        toolForRent.set("moreTimeAllowed", request.params.moretimeallowed);
                        toolForRent.save(null, {
                            success: function (toolForRent) {
                                response.sucess("Tool added sucess");
                            }
                        });
                    }
                    else {
                        response.error("Tool added sucess");
                    }

                }
                else {
                    response.error("user not found");
                }
            }
            
        });

    }
    else {
        response.error("userid is required");
    }
});
Parse.Cloud.define("getTools", function (request, response) {
    if (request.params.userid != null && request.params.userid != "") {
        var user = new Parse.User();
        user.id = request.params.userid;
        var ToolForRent = Parse.Object.extend("toolForRent");
        var query = new Parse.Query(ToolForRent);
        query.equalTo("user", user);
        query.find({
            success: function (toolForRent) {
                response.success(toolForRent);
            },
            error:function(error)
            {
                response.error("error occured");
            }
        });
    }
    else {
        response.error("userid missing in request");
    }
});

Parse.Cloud.define("addTakeToolForRent", function (request, response) {
    if (request.params.userid != null && request.params.userid != "") {//if (request.params.nonce != null && request.params.nonce != "" ) {
        var query = new Parse.Query(Parse.User);
        query.equalTo("objectId", request.params.userid);  // find all the women
        query.find({
            success: function (result) {
                if (result.length > 0) {
                    var user = new Parse.User();
                    user.id = request.params.userid;

                    if (request.params.toolId != null && request.params.toolId != "" && request.params.subcategoryId != null && request.params.subcategoryId != "" && request.params.amount != null && request.params.amount != "" && request.params.desc != null && request.params.desc != "" && request.params.make != null && request.params.make != "" && request.params.moretimeallowed != null && request.params.moretimeallowed != "" && request.params.imageURL != null && request.params.imageURL != "" && request.params.toolName != null && request.params.toolName != "") {

                        var ToolForRent = Parse.Object.extend("toolForRent");
                        var query = new Parse.Query(ToolForRent);
                        query.equalTo("objectId", request.params.toolId);
                        query.equalTo("isAvailable", "1");
                        query.find({
                            success: function (toolForRent) {
                                if (toolForRent.length > 0) {
                                    var ToolForRent = Parse.Object.extend("toolForRent");
                                    var toolForRent1 = new ToolForRent();
                                    toolForRent1.id = request.params.toolId;

                                    var ToolTakenForRent = Parse.Object.extend("toolTakenForRent");
                                    var toolTakenForRent = new ToolTakenForRent();

                                    toolTakenForRent.set("user", user);
                                    toolTakenForRent.set("toolRentId", toolForRent1);
                                    toolTakenForRent.set("toolName", toolForRent[0].get("toolName"));
                                    toolTakenForRent.set("starteDateTime", request.params.startDate);
                                    toolTakenForRent.set("endeDateTime", request.params.endDate);
                                    toolTakenForRent.set("pricePerDay", toolForRent[0].get("pricePerDay"));
                                    toolTakenForRent.set("isReturned", "0");
                                    toolTakenForRent.set("isCanceled", "0");
                                    toolTakenForRent.set("isPaymentDone", "0");
                                    toolTakenForRent.save(null, {
                                        success: function (toolForRent) {
                                            var ToolForRent = Parse.Object.extend("toolForRent");
                                            var toolForRent1 = new ToolForRent();
                                            toolForRent1.id = request.params.toolId;
                                            toolForRent1.set("isAvailable", "0");
                                            toolForRent1.set("isRented", "1");

                                            toolForRent1.save();
                                            response.sucess("tool rented sucess");
                                        }
                                    });
                                }
                                else {
                                    response.error("tool not available");
                                }
                            }
                        });
                    }
                    else {
                        response.error("request not found");
                    }

                }
                else {
                    response.error("user not found");
                }
            }

        });

    }
    else {
        response.error("userid is required");
    }
});


Parse.Cloud.define("getMyRentedTools", function (request, response) {
    if (request.params.userid != null && request.params.userid != "") {
        var user = new Parse.User();
        user.id = request.params.userid;


        var ToolTakenForRent = Parse.Object.extend("toolTakenForRent");
        var toolTakenForRent = new ToolTakenForRent();
        var query = new Parse.Query(ToolTakenForRent);
        query.equalTo("user", user);
        query.find({
            success: function (toolTakenForRent) {
                response.success(toolTakenForRent);
            },
            error: function (error) {
                response.error("error occured");
            }
        });
    }
    else {
        response.error("userid missing in request");
    }
});


Parse.Cloud.define("feedback", function (request, response) {
    if (request.params.userid != null && request.params.userid != "") {
        var user = new Parse.User();
        user.id = request.params.userid;
        var query = new Parse.Query(Parse.User);
        query.equalTo("objectId", request.params.userid);  // find all the women
        query.find({
            success: function (result) {
                if (result.length > 0) {
                    if (request.params.toolTakenForRentID != null && request.params.toolTakenForRentID != "" && request.params.comment != null && request.params.comment && request.params.rating != null && request.params.rating) {
                        var ToolTakenForRent = Parse.Object.extend("toolTakenForRent");
                        var toolTakenForRent = new ToolTakenForRent();
                        toolTakenForRent.id = request.params.toolTakenForRentID;

                        var UserFeedBack = Parse.Object.extend("userFeedBack");
                        var userFeedBack = new UserFeedBack();

                        userFeedBack.set("user", user);
                        userFeedBack.set("toolTakenForRentId", toolTakenForRent);
                        userFeedBack.set("comment", request.params.comment);
                        userFeedBack.set("rating", request.params.rating);
                        userFeedBack.save(null, {
                            success: function (userFeedBack) {

                                response.success("Thanks for feedback");
                            }
                        });
                    }
                    else {
                        response.error("please enter all fields");
                    }
                }
                else {
                    response.error("user not found");
                }
            },
            error: function (error) {
                response.error("error occured");
            }
        });
             
    }
    else {
        response.error("userid missing in request");
    }
});




