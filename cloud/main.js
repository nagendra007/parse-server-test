
//var stripe=new Stripe("sk_test_n2S4djhAGVIPM8C2oQuNzPF8");
var braintree = require("braintree");
var gateway = braintree.connect({
    environment: braintree.Environment.Sandbox,
    merchantId: "bt9cmxxgmv9smhng",
    publicKey: "5rsr9yzrgp7ztmbz",
    privateKey: "31e804049ca424d8c0ffcf31cf2a86e5"
});

Parse.Cloud.define('hello', function (req, res) {
    res.success('Hi test');
});





Parse.Cloud.define("toolPayment", function (request, response) {
    if (request.params.userid != null && request.params.userid != "" && request.params.BTcustomerid != null && request.params.BTcustomerid != "" && request.params.BTcardid != null && request.params.BTcardid != "" && request.params.amount != null && request.params.amount != "" && request.params.toolTakenForRentID != null && request.params.toolTakenForRentID != "") {


        var query = new Parse.Query(Parse.User);
        query.equalTo("objectId", request.params.userid);
        query.find({
            success: function (result) {
                if (result.length > 0) {

                    var user = new Parse.User();
                    user.id = request.params.userid;


                    var ToolTakenForRent = Parse.Object.extend("toolTakenForRent");
                    var query = new Parse.Query(ToolTakenForRent);
                    query.equalTo("user", user);
                    query.equalTo("objectId", request.params.toolTakenForRentID);
                    query.find().then(function (toolTakenForRent) {
                        if (toolTakenForRent.length > 0) {
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

                                    var UserPayment = Parse.Object.extend("userPayment");
                                    var userPayment = new UserPayment();
                                    userPayment.set("user", user);
                                    userPayment.set("txnId", result.transaction.id);
                                    userPayment.set("amount", result.transaction.amount);
                                    userPayment.save(null, {
                                        success: function (userPayment) {
                                            //response.success(userPayment);

                                            var userPayment = new UserPayment();
                                            userPayment.id = userPayment.id;
                                            var toolTakenForRent1 = new ToolTakenForRent();
                                            toolTakenForRent1.id = request.params.toolTakenForRentID;
                                            toolTakenForRent1.set("isPaymentDone", "1");
                                            toolTakenForRent1.set("userPaymentId", userPayment);
                                            toolTakenForRent1.save();


                                            var tooldata = toolTakenForRent[0].get("toolRentId");

                                            var ToolForRent = Parse.Object.extend("toolForRent");
                                            var toolForRent = new ToolForRent();
                                            toolForRent.id = tooldata.id;
                                            toolForRent.set("isAvailable", "1");
                                            toolForRent.set("isRented", "0");
                                            toolForRent.save();

                                            response.success("payment done successfuly");
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
                            response.error("taken tool not found");
                        }
                    }, function (error) {
                        response.error("error occured");
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

Parse.Cloud.define("addCreditCard", function (request, response) {
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
                        if (result.success == true) {
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

Parse.Cloud.define("getCreditCardList", function (request, response) {
    if (request.params.userid != null && request.params.userid != "") {

        var query = new Parse.Query(Parse.User);
        query.equalTo("objectId", request.params.userid);
        query.find({
            success: function (result) {
                if (result.length > 0) {

                    var user = new Parse.User();
                    user.id = request.params.userid;

                    var UserCreditCardInfo = Parse.Object.extend("userCreditCardInfo");

                    var query = new Parse.Query(UserCreditCardInfo);
                    query.equalTo("user", user);
                    query.select("BTcustomerid", "BTcardid", "cardtype", "maskedNumber", "ExpirationMonth", "ExpirationYear", "objectId", "isPrimary");
                    query.find({
                        success: function (userCreditCardInfo) {
                            response.success(userCreditCardInfo);
                        },
                        error: function (error) {
                            response.error("error occured");
                        }
                    });
                }
                else {
                    response.error("user not found");
                }
            },
            error: function (error) {
                response.error("Error: " + error.code + " " + error.message);
            }
        });
    }
    else {
        response.error("userid missing in request");
    }
});

Parse.Cloud.define("setPrimaryCreditCard", function (request, response) {
    if (request.params.userid != null && request.params.userid != "" && request.params.userCreditCardid != null && request.params.userCreditCardid != "") {
        var query = new Parse.Query(Parse.User);
        query.equalTo("objectId", request.params.userid);
        query.find({
            success: function (result) {
                if (result.length > 0) {

                    var user = new Parse.User();
                    user.id = request.params.userid;

                    var UserCreditCardInfo = Parse.Object.extend("userCreditCardInfo");

                    var query = new Parse.Query(UserCreditCardInfo);
                    query.equalTo("user", user);
                    query.equalTo("objectId", request.params.userCreditCardid);
                    query.find().then(function (userCreditCardInfo) {
                        //response.success(userCreditCardInfo);

                        if (userCreditCardInfo.length > 0) {
                            var query = new Parse.Query(UserCreditCardInfo);
                            query.equalTo("user", user);
                            query.find().then(function (userCreditCardInfo) {
                                if (userCreditCardInfo.length > 0) {
                                    for (var i = 0; i < userCreditCardInfo.length; i++) {
                                        var userCreditCardInfo1 = Parse.Object.extend("userCreditCardInfo");
                                        var userCreditCardInfo1 = new userCreditCardInfo1();

                                        var cardid = "";
                                        var cardid = userCreditCardInfo[i].id;

                                        userCreditCardInfo1.id = cardid;
                                        if (cardid == request.params.userCreditCardid) {
                                            userCreditCardInfo1.set("isPrimary", "1");
                                        }
                                        else {
                                            userCreditCardInfo1.set("isPrimary", "0");
                                        }
                                        userCreditCardInfo1.save();
                                    }
                                    response.success("Primary cc set successfuly");
                                }
                                else {
                                    response.error("No CC  found in your account");
                                }
                            }, function (error) {
                                response.error("error occured");
                            });

                        }
                        else {
                            response.error("CC not found in your account");
                        }
                    }, function (error) {
                        response.error("error occured");
                    });
                }
                else {
                    response.error("user not found");
                }
            },
            error: function (error) {
                response.error("Error: " + error.code + " " + error.message);
            }
        });
    }
    else {
        response.error("please pass request params");
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


                        //var point = new Parse.GeoPoint( 19.2403, 73.1305);
                        var UserDetails = Parse.Object.extend("userDetails");
                        var userDetailstest = new UserDetails();

                        if (userDetailss.length > 0) {

                            var myid = "";
                            myid = userDetailss[0].id;
                            userDetailstest.id = myid;
                        }
                        else {
                            var user = new Parse.User();
                            user.id = request.params.userid;
                            userDetailstest.set("user", user);
                        }


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
                        if (request.params.latitude != null && request.params.latitude != "" && request.params.longitude != null && request.params.longitude != "") {
                            var point = new Parse.GeoPoint(parseFloat(request.params.latitude), parseFloat(request.params.longitude));
                            userDetailstest.set("location", point);
                        }
                        else {
                            var point = new Parse.GeoPoint(parseFloat(0), parseFloat(0));
                            userDetailstest.set("location", point);
                        }



                        //userDetailstest.save({
                        //    success: function (results) {
                        //        response.success(results);
                        //    },
                        //    error: function (error) {
                        //        response.error("Error: " + error.code + " " + error.message);
                        //    }
                        //});

                        userDetailstest.save(null, {
                            success: function (userDetailstest) {
                                response.success(userDetailstest);
                            },
                            error: function (error) {
                                response.error("error in adding card in collection");
                            }
                        });
                    });
                    //response.success("Add success");
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

        var point = new Parse.GeoPoint(parseFloat( request.params.latitude), parseFloat( request.params.longitude));
        //var point = new Parse.GeoPoint(18.2403, 73.1305);
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
                    query.equalTo("isDeleted", "0");

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
                    query.include("userDetailsId");
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
    if (request.params.userid != null && request.params.userid != "") {//if (request.params.nonce != null && request.params.nonce != "" ) {
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
    if (request.params.userid != null && request.params.userid != "") {
        var user = new Parse.User();
        user.id = request.params.userid;

        var query = new Parse.Query("userDetails");
        query.equalTo("user", user);
        query.find().then(function (results) {
            if (results.length > 0) {

                if (request.params.categoryId != null && request.params.categoryId != "" && request.params.subcategoryId != null && request.params.subcategoryId != "" && request.params.amount != null && request.params.amount != "" && request.params.desc != null && request.params.desc != "" && request.params.make != null && request.params.make != "" && request.params.moretimeallowed != null && request.params.moretimeallowed != "" && request.params.imageURL != null && request.params.imageURL != "" && request.params.toolName != null && request.params.toolName != "" && request.params.startDate != null && request.params.startDate != "" && request.params.endDate != null && request.params.endDate != "") {
                    if (!isNaN(request.params.amount)) {
                        var newamount = parseFloat(request.params.amount);
                        var decimalAmount = "";
                        decimalAmount = newamount.toFixed(2);

                        var sdate = new Date(request.params.startDate);
                        var edate = new Date(request.params.endDate);
                        var userdetailsId = "";
                        var userdetailsId = results[0].id;
                        var Userdetails = Parse.Object.extend("userDetails");
                        var userdetails = new Userdetails();
                        userdetails.id = userdetailsId;


                        var ToolCategory = Parse.Object.extend("toolCategory");
                        var toolCategory = new ToolCategory();
                        toolCategory.id = request.params.categoryId;

                        var ToolSubCategory = Parse.Object.extend("toolSubCategory");
                        var toolSubCategory = new ToolSubCategory();
                        toolSubCategory.id = request.params.subcategoryId;

                        //var ToolSubCategory = Parse.Object.extend("toolSubCategory");
                        var query = new Parse.Query(ToolSubCategory);
                        query.equalTo("categoryId", toolCategory);
                        query.equalTo("objectId", request.params.subcategoryId);
                        query.find().then(function (toolSubCategory1) {
                            if (toolSubCategory1.length > 0) {

                                var ToolForRent = Parse.Object.extend("toolForRent");
                                var toolForRent = new ToolForRent();

                                toolForRent.set("user", user);
                                toolForRent.set("toolName", request.params.toolName);
                                toolForRent.set("categoryId", toolCategory);
                                toolForRent.set("subCategoryId", toolSubCategory);
                                toolForRent.set("userDetailsId", userdetails);
                                toolForRent.set("description", request.params.desc);
                                toolForRent.set("pricePerDay", decimalAmount);
                                toolForRent.set("isAvailable", "1");
                                toolForRent.set("isRented", "0");
                                toolForRent.set("toolImageURL", request.params.imageURL);
                                //toolForRent.set("toolImageName", "");
                                toolForRent.set("manufacturer", request.params.make);
                                toolForRent.set("moreTimeAllowed", request.params.moretimeallowed);
                                toolForRent.set("startDate", sdate);
                                toolForRent.set("endDate", edate);
                                toolForRent.set("isDeleted", "0");
                                toolForRent.save(null, {
                                    success: function (toolForRent) {
                                        response.success("Tool added success");
                                    },
                                    error: function (error) {
                                        response.error(error);
                                    }
                                });
                            }
                            else {
                                response.error("categoty or sub category invalid");
                            }
                        }, function (error) {
                            response.error(error);
                        });
                    }
                    else {
                        response.error("please pass valid amount");
                    }
                }
                else {
                    response.error("missing request parameters");
                }

            }
            else {
                response.error("user not found");
            }
        }, function (error) {
            response.error(error);
        });

    }
    else {
        response.error("userid is required");
    }
});

Parse.Cloud.define("getRentableTools", function (request, response) {
    if (request.params.userid != null && request.params.userid != "") {
        var user = new Parse.User();
        user.id = request.params.userid;
        var ToolForRent = Parse.Object.extend("toolForRent");
        var query = new Parse.Query(ToolForRent);
        query.equalTo("user", user);
        query.equalTo("isAvailable", "1");
        query.equalTo("isDeleted", "0");
        query.find({
            success: function (toolForRent) {
                response.success(toolForRent);
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

Parse.Cloud.define("getRentedTools", function (request, response) {
    if (request.params.userid != null && request.params.userid != "") {
        var user = new Parse.User();
        user.id = request.params.userid;
        var ToolForRent = Parse.Object.extend("toolForRent");
        var query = new Parse.Query(ToolForRent);
        query.equalTo("user", user);
        query.equalTo("isAvailable", "0");
        query.equalTo("isDeleted", "0");
        query.find({
            success: function (toolForRent) {
                if (toolForRent.length > 0) {
                    var ToolTakenForRent = Parse.Object.extend("toolTakenForRent");
                    var query = new Parse.Query(ToolTakenForRent);
                    query.containedIn("toolRentId", toolForRent);
                    query.equalTo("isPaymentDone", "0");
                    query.include("toolRentId");
                    query.include("userDetailsId");
                    query.find({
                        success: function (toolTakenForRent) {
                            response.success(toolTakenForRent);
                        },
                        error: function (error) {
                            response.error(error);
                        }
                    });
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
                        
                        var query=new Parse.Query(ToolTakenForRent);

                        query.equalTo("objectId", request.params.toolTakenForRentID);
                        query.find().then(function (result) {
                            if (result.length > 0) {

                                var tooldata = result[0].get("toolRentId");

                                var ToolForRent = Parse.Object.extend("toolForRent");
                                var toolForRent = new ToolForRent();
                                toolForRent.id = tooldata.id;

                               // response.success(tooldata.id);

                                var toolTakenForRent = new ToolTakenForRent();
                                toolTakenForRent.id = request.params.toolTakenForRentID;

                                

                                var UserFeedBack = Parse.Object.extend("userFeedBack");
                                var userFeedBack = new UserFeedBack();

                                userFeedBack.set("user", user);
                                userFeedBack.set("toolTakenForRentId", toolTakenForRent);
                                userFeedBack.set("toolForRentId", toolForRent);
                                userFeedBack.set("comment", request.params.comment);
                                userFeedBack.set("rating", request.params.rating);
                                userFeedBack.save(null, {
                                    success: function (userFeedBack) {

                                        response.success("Thanks for feedback");
                                    }, error: function (error) {
                                        response.error(error);
                                    }
                                });
                            }
                            else {
                                response.error("Taken tool not found");
                            }
                        }, function (error) {
                            response.error(error);
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

Parse.Cloud.define("addTakeToolForRent", function (request, response) {
    if (request.params.userid != null && request.params.userid != "" && request.params.toolId != null && request.params.toolId != ""
        && request.params.startDate != null && request.params.startDate != "" && request.params.endDate != null && request.params.endDate != "") {
        //request.params.scheduleDate &&  request.params.scheduleDate && request.params.scheduleTime request.params.scheduleTime 
        //request.params.isRentNowPickUp && request.params.isRentNowPickUp &&  request.params.isSchedulePickUp &&  request.params.isSchedulePickUp
        
        var user = new Parse.User();
        user.id = request.params.userid;
        var query = new Parse.Query("userDetails");
        query.equalTo("user", user);
        query.find().then(function (results) {
            //success: function (results) {
            if (results.length > 0) {

                var userdetailsId = "";
                var userdetailsId = results[0].id;
                var Userdetails = Parse.Object.extend("userDetails");
                var userdetails = new Userdetails();
                userdetails.id = userdetailsId;

                var ToolForRent = Parse.Object.extend("toolForRent");
                var query = new Parse.Query(ToolForRent);
                query.equalTo("objectId", request.params.toolId);
                query.equalTo("isAvailable", "1");
                query.equalTo("isDeleted", "0");
                query.find().then(function (toolForRent) {
                    //success: function (toolForRent) {
                    if (toolForRent.length > 0) {

                        var toolName = "";
                        toolName = toolForRent[0].get("toolName");
                        var pricePerDay = "";
                        pricePerDay = toolForRent[0].get("pricePerDay");


                        var ToolForRent = Parse.Object.extend("toolForRent");

                        var toolForRent1 = new ToolForRent();
                        toolForRent1.id = request.params.toolId;

                        var ToolTakenForRent = Parse.Object.extend("toolTakenForRent");
                        var toolTakenForRent = new ToolTakenForRent();

                        var sdate = new Date(request.params.startDate);
                        var edate = new Date(request.params.endDate);


                        toolTakenForRent.set("user", user);
                        toolTakenForRent.set("userDetailsId", userdetails);
                        toolTakenForRent.set("toolRentId", toolForRent1);
                        toolTakenForRent.set("toolName", toolName);
                        toolTakenForRent.set("starteDateTime", sdate);
                        toolTakenForRent.set("endeDateTime", edate);
                        toolTakenForRent.set("pricePerDay", pricePerDay);
                        toolTakenForRent.set("isReturned", "0");
                        toolTakenForRent.set("isCanceled", "0");
                        toolTakenForRent.set("isPaymentDone", "0");

                        //toolTakenForRent.set("scheduleDate", request.params.scheduleDate);
                        //toolTakenForRent.set("scheduleTime", request.params.scheduleTime);
                        //toolTakenForRent.set("isRentNowPickUp", request.params.isRentNowPickUp);
                        //toolTakenForRent.set("isSchedulePickUp", request.params.isSchedulePickUp);
                        //toolTakenForRent.set("isApproved", "0");
                        //toolTakenForRent.set("isPicked", "0");


                        toolTakenForRent.save(null, {
                            success: function (toolTakenForRent) {
                                var ToolForRent = Parse.Object.extend("toolForRent");
                                var toolForRent1 = new ToolForRent();
                                toolForRent1.id = request.params.toolId;
                                toolForRent1.set("isAvailable", "0");
                                toolForRent1.set("isRented", "1");

                                toolForRent1.save();
                                response.success("tool rented success");
                            },
                            error: function (error) {
                                response.error(error);
                            }
                        });
                    }
                    else {
                        response.error("tool not available");
                    }
                });
            }
            else {
                response.error("User details not found, please update your profile");
            }
        }, function (error) {
            response.error("Error: " + error.code + " " + error.message);
        });
    }
    else {
        response.error("some missing request parameters");
    }
});

Parse.Cloud.define("getCategory", function (request, response) {

    var query = new Parse.Query("toolCategory");
    query.find({
        success: function (results) {
            response.success(results);
        },
        error: function (error) {
            response.error("Error: " + error.code + " " + error.message);
        }
    });
});

Parse.Cloud.define("getSubCategory", function (request, response) {
    if (request.params.categoryId != null && request.params.categoryId != "") {
        var ToolCategory = Parse.Object.extend("toolCategory");
        var toolCategory = new ToolCategory();
        toolCategory.id = request.params.categoryId;

        var ToolSubCategory = Parse.Object.extend("toolSubCategory");
        var query = new Parse.Query(ToolSubCategory);
        query.equalTo("categoryId", toolCategory);
        //query.include("categoryId");
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
        response.error("Category id missing in request parameters");
    }

});

Parse.Cloud.define("uploadImage", function (request, response) {
    if (request.params.fileName != null && request.params.fileName != "" && request.params.base64 != null && request.params.base64 != "") {

        var parseFile = new Parse.File(request.params.fileName, { base64: request.params.base64 });
        parseFile.save().then(function (result) {
            var url = result.url();
            response.success(url);
        }, function (error) {
            response.error(error);
        });
    }
    else {
        response.error("missing file parameters");
    }


    //var file = new Parse.File("logo.png", {
    //    base64: request.body.image
    //});

    ////file.save().then(function () {
    ////    response.success( file.url());

    ////});

    ////var parseFile = new Parse.File(name, file);
    //file.save().then(function (parseFile) {
    //    var url = parseFile.url();
    //    response.success(url);
    //}, function (error) {
    //    response.success(error);
    //});


    
});

Parse.Cloud.define("getToolDetails", function (request, response) {
    if (request.params.toolId != null && request.params.toolId != "") { //request.params.userid != null && request.params.userid!="" &&
        var user = new Parse.User();
        user.id = request.params.userid;
        var ToolForRent = Parse.Object.extend("toolForRent");
        var query = new Parse.Query(ToolForRent);
        //query.equalTo("user", user);
        //query.equalTo("isAvailable", "1");
        query.equalTo("objectId", request.params.toolId);
        query.include("userDetailsId");
        query.find({
            success: function (toolForRent) {
                response.success(toolForRent);
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

Parse.Cloud.define("updateTool", function (request, response) {
    if (request.params.userid != null && request.params.userid != "") {
        var user = new Parse.User();
        user.id = request.params.userid;
        var query = new Parse.Query("userDetails");
        query.equalTo("user", user);
        query.find().then(function (results) {
            if (results.length > 0) {
                if (request.params.toolId != null && request.params.toolId != "" && request.params.amount != null && request.params.amount != "" && request.params.desc != null && request.params.desc != "" && request.params.make != null && request.params.make != "" && request.params.moretimeallowed != null && request.params.moretimeallowed != "" && request.params.imageURL != null && request.params.imageURL != "" && request.params.toolName != null && request.params.toolName != "" && request.params.startDate != null && request.params.startDate != "" && request.params.endDate != null && request.params.endDate != "") {
                    if (!isNaN(request.params.amount)) {

                        var newamount = parseFloat(request.params.amount);
                        var decimalAmount = "";
                        decimalAmount = newamount.toFixed(2);

                        var sdate = new Date(request.params.startDate);
                        var edate = new Date(request.params.endDate);


                        var ToolForRent1 = Parse.Object.extend("toolForRent");
                        var query = new Parse.Query(ToolForRent1);
                        query.equalTo("isAvailable", "1");
                        query.equalTo("isDeleted", "0");
                        query.equalTo("objectId", request.params.toolId);
                        query.equalTo("user", user);
                        query.find().then(function (toolForRent1) {
                            if (toolForRent1.length > 0) {
                                var toolId = request.params.toolId
                                var ToolForRent = Parse.Object.extend("toolForRent");
                                var toolForRent = new ToolForRent();
                                toolForRent.id = toolId;
                                //toolForRent.set("user", user);
                                toolForRent.set("toolName", request.params.toolName);
                                //toolForRent.set("categoryId", toolCategory);
                                //toolForRent.set("subCategoryId", toolSubCategory);
                                //toolForRent.set("userDetailsId", userdetails);
                                toolForRent.set("description", request.params.desc);
                                toolForRent.set("pricePerDay", decimalAmount);
                                //toolForRent.set("isAvailable", "1");
                                //toolForRent.set("isRented", "0");
                                toolForRent.set("toolImageURL", request.params.imageURL);
                                //toolForRent.set("toolImageName", "");
                                toolForRent.set("manufacturer", request.params.make);
                                toolForRent.set("moreTimeAllowed", request.params.moretimeallowed);
                                toolForRent.set("startDate", sdate);
                                toolForRent.set("endDate", edate);
                                toolForRent.save(null, {
                                    success: function (toolForRent) {
                                        response.success("Tool updated success");
                                    },
                                    error: function (error) {
                                        response.error("error occured");
                                    }
                                });
                            }
                            else {
                                response.error("Tool deleted or not available ");
                            }
                        }, function (error) {
                            response.error(error);
                        });
                    }
                    else {
                        response.error("please pass valid amount");
                    }
                }
                else {
                    response.error("missing request parameters");
                }

            }
            else {
                response.error("user not found");
            }
        }, function (error) {
            response.error(error);
        });

    }
    else {
        response.error("userid is required");
    }
});

Parse.Cloud.define("btClientToken", function (request, response) {
    if (request.params.userid != null && request.params.userid != "") {
        var query = new Parse.Query(Parse.User);
        query.equalTo("objectId", request.params.userid);
        query.find({
            success: function (result) {
                if (result.length > 0) {
                    gateway.clientToken.generate({}, function (err, res) {
                        response.success(res.clientToken);
                    },
                    function (error) {
                        response.error(error);
                    });
                }
                else {
                    response.error("user not found");
                }
            },
            error: function (error) {
                response.error(error);
            }
        });
    }
    else {
        response.error("please provide userid");
    }
});

Parse.Cloud.define("getToolRating", function (request, response) {
    if (request.params.userid != null && request.params.userid != "" && request.params.toolId != null && request.params.toolId != "") {
        var query = new Parse.Query(Parse.User);
        query.equalTo("objectId", request.params.userid);
        query.find({
            success: function (result) {
                if (result.length > 0) {
                    var ToolForRent = Parse.Object.extend("toolForRent");
                    var toolForRent = new ToolForRent();
                    toolForRent.id = request.params.toolId;

                    var UserFeedBack = Parse.Object.extend("userFeedBack");
                    var query = new Parse.Query(UserFeedBack);
                    query.equalTo("toolForRentId", toolForRent);
                    query.find().then(function (userFeedBack) {
                        if (userFeedBack.length > 0) {
                            var sumOfRating = 0;
                            for (var i = 0; i < userFeedBack.length; i++) {
                                sumOfRating = sumOfRating + parseFloat(userFeedBack[i].get("rating"));
                            }
                            var avg = sumOfRating / userFeedBack.length;
                            var data = ({ avgrating: avg });
                            response.success(data);
                        }
                        else {
                            var data = ({ avgrating: 0 });
                            response.success(data);
                        }
                    },
                    function (error) {
                        response.error(error);
                    });
                }
                else {
                    response.error("user not found");
                }
            },
            error: function (error) {
                response.error(error);
            }
        });
    }
    else {
        response.error("please provide userid");
    }
});

Parse.Cloud.define("removeTool", function (request, response) {
    if (request.params.userid != null && request.params.userid != "") {
        var user = new Parse.User();
        user.id = request.params.userid;
        var query = new Parse.Query("userDetails");
        query.equalTo("user", user);
        query.find().then(function (results) {
            if (results.length > 0) {
                if (request.params.toolId != null && request.params.toolId != "") {
                    var newamount = parseFloat(request.params.amount);
                    var decimalAmount = "";
                    decimalAmount = newamount.toFixed(2);

                    var sdate = new Date(request.params.startDate);
                    var edate = new Date(request.params.endDate);

                    var ToolForRent1 = Parse.Object.extend("toolForRent");
                    var query = new Parse.Query(ToolForRent1);
                    query.equalTo("isAvailable", "1");
                    query.equalTo("objectId", request.params.toolId);
                    query.equalTo("user", user);
                    query.find().then(function (toolForRent1) {
                        if (toolForRent1.length > 0) {
                            var toolId = request.params.toolId

                            var ToolForRent = Parse.Object.extend("toolForRent");

                            var toolForRent = new ToolForRent();
                            toolForRent.id = toolId;
                            toolForRent.set("isDeleted", "1");
                            toolForRent.save(null, {
                                success: function (toolForRent) {
                                    response.success("Tool deleted success");
                                },
                                error: function (error) {
                                    response.error(error);
                                }
                            });
                        }
                        else {
                            response.error("Tool not found or currently rented");
                        }
                    }, function (error) {
                        response.error(error);
                    });
                }
                else {
                    response.error("missing request parameters");
                }

            }
            else {
                response.error("user not found");
            }
        }, function (error) {
            response.error(error);
        });

    }
    else {
        response.error("userid is required");
    }
});



Parse.Cloud.define("braintreepayold", function (request, response) {
    if (request.params.userid != null && request.params.userid != "" && request.params.BTcustomerid != null && request.params.BTcustomerid != "" && request.params.BTcardid != null && request.params.BTcardid != "" && request.params.amount != null && request.params.amount != "" && request.params.toolTakenForRentID != null && request.params.toolTakenForRentID != "") {
        var user = new Parse.User();
        user.id = request.params.userid;


        var query = new Parse.Query(Parse.User);
        query.equalTo("objectId", request.params.userid);
        query.find({
            success: function (result) {
                if (result.length > 0) {


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

                            var ToolTakenForRent = Parse.Object.extend("toolTakenForRent");
                            var toolTakenForRent = new ToolTakenForRent();
                            toolTakenForRent.id = request.params.toolTakenForRentID;

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

Parse.Cloud.define("uploadToolImage", function (request, response) {
    if (request.params.userid != null && request.params.userid != "" && request.params.toolId != null && request.params.toolId != "" && request.params.fileName != null && request.params.fileName != "" && request.params.base64 != null && request.params.base64 != "") {


        var user = new Parse.User();
        user.id = request.params.userid;
        var query = new Parse.Query("userDetails");
        query.equalTo("user", user);
        query.find().then(function (results) {
            if (results.length > 0) {

                var ToolForRent1 = Parse.Object.extend("toolForRent");
                var query = new Parse.Query(ToolForRent1);
                query.equalTo("isAvailable", "1");
                query.equalTo("isDeleted", "0");
                query.equalTo("objectId", request.params.toolId);
                query.equalTo("user", user);
                query.find().then(function (toolForRent1) {
                    if (toolForRent1.length > 0) {

                        var parseFile = new Parse.File(request.params.fileName, { base64: request.params.base64 });
                        parseFile.save().then(function (result) {
                            var url = result.url();

                            var toolId = request.params.toolId
                            var ToolForRent = Parse.Object.extend("toolForRent");
                            var toolForRent = new ToolForRent();
                            toolForRent.id = toolId;
                            toolForRent.set("toolImageURL", url);
                            toolForRent.save(null, {
                                success: function (toolForRent) {
                                    response.success(url);
                                },
                                error: function (error) {
                                    response.error("error occured");
                                }
                            });
                        }, function (error) {
                            response.error(error);
                        });
                    }
                    else {
                        response.error("Tool deleted or not available ");
                    }
                }, function (error) {
                    response.error(error);
                });
            }
            else {
                response.error("missing request parameters");
            }


        }, function (error) {
            response.error(error);
        });


        
    }
    else {
        response.error("missing file parameters");
    }

});

Parse.Cloud.define("toolApplePayment", function (request, response) {
    if (request.params.userid != null && request.params.userid != "" && request.params.nonce != null && request.params.nonce != ""  && request.params.amount != null && request.params.amount != "" && request.params.toolTakenForRentID != null && request.params.toolTakenForRentID != "") {


        var query = new Parse.Query(Parse.User);
        query.equalTo("objectId", request.params.userid);
        query.find({
            success: function (result) {
                if (result.length > 0) {

                    var user = new Parse.User();
                    user.id = request.params.userid;


                    var ToolTakenForRent = Parse.Object.extend("toolTakenForRent");
                    var query = new Parse.Query(ToolTakenForRent);
                    query.equalTo("user", user);
                    query.equalTo("objectId", request.params.toolTakenForRentID);
                    query.find().then(function (toolTakenForRent) {
                        if (toolTakenForRent.length > 0) {
                            gateway.transaction.sale({
                                amount: request.params.amount,
                                paymentMethodNonce: request.params.nonce,
                                //CustomerId: request.params.BTcustomerid,// balcustomerid,
                                //PaymentMethodToken: request.params.BTcardid,
                                options: {
                                    submitForSettlement: true
                                }
                            }, function (err, result) {
                                if (result.success == true) {

                                    var UserPayment = Parse.Object.extend("userPayment");
                                    var userPayment = new UserPayment();
                                    userPayment.set("user", user);
                                    userPayment.set("txnId", result.transaction.id);
                                    userPayment.set("amount", result.transaction.amount);
                                    userPayment.set("type", "applepay");
                                    userPayment.save(null, {
                                        success: function (userPayment) {
                                            //response.success(userPayment);


                                            var userPayment = new UserPayment();
                                            userPayment.id = userPayment.id;
                                            var toolTakenForRent1 = new ToolTakenForRent();
                                            toolTakenForRent1.id = request.params.toolTakenForRentID;
                                            toolTakenForRent1.set("isPaymentDone", "1");
                                            toolTakenForRent1.set("userPaymentId", userPayment);
                                            toolTakenForRent1.save();


                                            var tooldata = toolTakenForRent[0].get("toolRentId");

                                            var ToolForRent = Parse.Object.extend("toolForRent");
                                            var toolForRent = new ToolForRent();
                                            toolForRent.id = tooldata.id;
                                            toolForRent.set("isAvailable", "1");
                                            toolForRent.set("isRented", "0");
                                            toolForRent.save();

                                            response.success("payment done successfuly");
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
                            response.error("taken tool not found");
                        }
                    }, function (error) {
                        response.error("error occured");
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

Parse.Cloud.define("setDeviceToken", function (request, response) {
    if (request.params.userid != null && request.params.userid != "" && request.params.deviceToken != null && request.params.deviceToken != "" && request.params.deviceType != null && request.params.deviceType != "") {
        var user = new Parse.User();
        user.id = request.params.userid;
        var query = new Parse.Query(Parse.User);
        query.equalTo("objectId", request.params.userid);  // find all the women
        query.find({
            success: function (result) {
                if (result.length > 0) {
                    var query = new Parse.Query(Parse.Installation);
                    query.equalTo('user', user);
                    query.equalTo('deviceToken', request.params.deviceToken);
                    query.equalTo('deviceType', request.params.deviceType);
                    query.find().then(function (result) {
                        if (result.length > 0)
                        {
                            response.success("Device already registered");
                        }
                        else {
                            var installationQuery = Parse.Installation;
                            var abc = new installationQuery();
                            abc.set('deviceToken', request.params.deviceToken);
                            abc.set('deviceType', request.params.deviceType);

                            abc.set('user', user);
                            abc.save();

                            response.success("device added success");
                        }
                       
                    }, function (error) {
                        response.error("user not found");
                    });

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

Parse.Cloud.define("sendPushMeesage", function (request, response) {
    if (request.params.userid != null && request.params.userid != "") {
        var user = new Parse.User();
        user.id = request.params.userid;
        var query = new Parse.Query(Parse.User);
        query.equalTo("objectId", request.params.userid);  // find all the women
        query.find({
            success: function (result) {
                if (result.length > 0) {

                    var query = new Parse.Query(Parse.Installation);
                    query.equalTo('user', user);

                    Parse.Push.send({
                        where: query, // Set our Installation query
                        data: {
                            alert: "Hey you tool time is going to out."
                        }
                    }, {
                        success: function () {
                            response.success("Push was successful");
                        },
                        error: function (error) {
                            response.error(error);
                        },
                        useMasterKey: true
                    });

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

Parse.Cloud.define("uploadImageBlob", function (request, response) {
    if (request.params.fileName != null && request.params.fileName != "" && request.params.base64 != null && request.params.base64 != "" && request.params.contentType != null && request.params.contentType != "") {
        var azure = require('azure-storage');
        var blobSvc = azure.createBlobService("isazurestore", "pRzLhNX1f0uxa/zJq7eHGEItUV7QLZpyATYxOjqMGmHDRuW7OpngVPXlicmuO1MOjP9oGS4mHRodlOHAnjuWTA==");
        //var blobSvc = azure.createBlobService("bbazurestore", "G+bJuIymQk/BXUNy8SFnnBSj9O5Li22GosaCPy6reG/M+Hjsby6Zu7efv0YOa/LpudE7CVCWQX+Crn1d8XVDBg==");
        blobSvc.createContainerIfNotExists('toolio', function (error, result, response1) {
            if (!error) {
               //response.error(error);
            }
            //response.success(response1);
        });
        blobSvc.createBlockBlobFromText('toolio', request.params.fileName, request.params.base64, { contentType: 'image/png', contentEncoding: 'base64' },
                      function (error, result, response1) {
                          if (error) {
                              response.error(error);
                          }
                          response.success(response1);
                      });

    }
    else {
        response.error("missing file parameters");
    }


});

Parse.Cloud.define("sendEmailMandrill", function (request, response) {
    var mandrill = require('mandrill-api/mandrill');
    var mandrill_client = new mandrill.Mandrill('bGUnQ6_ltOqp4rkonKZO7Q');//('524eb66b5ed31021f065ffea4ef0a220');//

    var message = {
        "html": "<p>Example HTML content nagendra</p>",
        "text": "Example text content",
        "subject": "example subject",
        "from_email": "nagendra.singh@ninedots.com",
        "from_name": "sender test",
        "to": [{
            "email": "nagendra.singh@ninedots.com",
            "name": "nagendra",
            "type": "to"
        }]
    };
    var async = false;
    var ip_pool = "Main Pool";
    var send_at = "example send_at";
    mandrill_client.messages.send({ "message": message, "async": async }, function (result) {//, "ip_pool": ip_pool, "send_at": send_at
        response.success(result);
        /*
        [{
                "email": "recipient.email@example.com",
                "status": "sent",
                "reject_reason": "hard-bounce",
                "_id": "abc123abc123abc123abc123abc123"
            }]
        */
    }, function (e) {
        response.success(e);
        // Mandrill returns the error as an object with name and message keys
        //console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
        // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
    });


    //    mandrill_client.sendEmail({
    //        message: {
    //            text: "test",
    //            subject: "Parse and Mandrill!",
    //            from_email: "nagendra.singh@ninedots.com",
    //            from_name: "testing",
    //            to: [
    //                {
    //                    email: "gunjan.sharma@ninedots.com",
    //                    name: "Some Name"
    //                }
    //            ]
    //        },
    //        async: true
    //    }, {
    //        success: function (httpResponse) {
    //            response.success("email sent");
    //        },
    //        error: function (httpResponse) {
    //            response.success(httpResponse);
    //        }
    //    }
    //);
    //var Mandrill = require('mandrill');
    //Mandrill.initialize('MANDRILL_KEY');
    //Mandrill.sendEmail({
    //    message: {
    //        text: request.params.text,
    //        subject: "Parse and Mandrill!",
    //        from_email: "email@example.com",
    //        from_name: "Name",
    //        to: [
    //            {
    //                email: request.params.email,
    //                name: "Some Name"
    //            }
    //        ]
    //    },
    //    async: true
    //}, {
    //    success: function (httpResponse) {
    //        response.success("email sent");
    //    },
    //    error: function (httpResponse) {

    //    }
    //}
    //);

    //var Mandrill = require('cloud/mandrillTemplateSend.js');

    //Mandrill.initialize('bGUnQ6_ltOqp4rkonKZO7Q');
    //Mandrill.sendTemplate({
    //    template_name: request.params.templateName,
    //    template_content: [{
    //        name: "test",
    //        content: "hi hello" //Those are required but they are ignored
    //    }],
    //    message: {
    //        to: [{
    //            email: request.params.toEmail,
    //            name: request.params.toName
    //        }],
    //        important: true
    //    },
    //    async: false
    //}, {
    //    success: function (httpResponse) {
    //        console.log(httpResponse);
    //        response.success("Email sent!");
    //    },
    //    error: function (httpResponse) {
    //        console.error(httpResponse);
    //        response.error("Uh oh, something went wrong");
    //    }
    //});
});

Parse.Cloud.define("sendEmailSendGrid", function (request, response) {

    var ApiKeyStores = Parse.Object.extend("apiKeyStores");
    var apiKeyStores = new ApiKeyStores();

    var query = new Parse.Query("apiKeyStores");
    query.equalTo("plateform", "sendgrid");
    query.find().then(function (results) {
        if (results.length > 0) {
            var apikey = results[0].get("apikey");

            var helper = require('sendgrid').mail;

            var from_email = new helper.Email("nagendra.singh@ninedots.com");
            var to_email = new helper.Email("nagendra.singh@ninedots.com");
            var subject = "Sending with SendGrid is Fun";
            var content = new helper.Content("text/plain", "and easy to do anywhere, even with Node.js");
            var mail = new helper.Mail(from_email, subject, to_email, content);

            var sg = require('sendgrid')(apikey);
            var request = sg.emptyRequest({
                method: 'POST',
                path: '/v3/mail/send',
                body: mail.toJSON()
            });

            sg.API(request, function (error, res) {
                if (error) {
                    response.error(error);
                }
                response.success(res);
            });
        }
        else {
            response.error("sendgrid Key not found");
        }
    },
    function (error) {
        response.error(error);
    });




    //var sendgrid = require('sendgrid')('judF8IEyT9Wf2yuyKUWxgA');
    //var email = new sendgrid.Email();

    //email.addTo("nagendra.singh@ninedots.com");
    //email.setFrom("nagendra.singh@ninedots.com");
    //email.setSubject("Sending with SendGrid is Fun");
    //email.setHtml("and easy to do anywhere, even with Node.js");

    //sendgrid.send(email);


    //sendgrid.send({
    //    to: 'nagendra.singh@ninedots.com',
    //    from: 'nagendra.singh@ninedots.com',
    //    subject: 'test',
    //    text: 'test'
    //},function (err, json) {
    //    if (err) {
    //        response.error(err);
    //    }
    //    response.success(json);
    //});

});

Parse.Cloud.define("sendEmail", function (request, response) {
    if (request.params.toEmail != null && request.params.toEmail != null && request.params.subject != null && request.params.subject != null && request.params.body != null && request.params.body != null)
        

    var ApiKeyStores = Parse.Object.extend("apiKeyStores");
    var apiKeyStores = new ApiKeyStores();

    var query = new Parse.Query("apiKeyStores");
    query.equalTo("plateform", "sendgrid");
    query.find().then(function (results) {
        if (results.length > 0) {
            var apikey = results[0].get("apikey");

            var helper = require('sendgrid').mail;
            var from_email = new helper.Email("nagendra.singh@ninedots.com");
            var to_email = new helper.Email(request.params.toEmail);
            var subject = request.params.subject;
            var content = new helper.Content("text/html", request.params.body); //text/plain
            var mail = new helper.Mail(from_email, subject, to_email, content);

            var sg = require('sendgrid')(apikey);
            var request = sg.emptyRequest({
                method: 'POST',
                path: '/v3/mail/send',
                body: mail.toJSON()
            });

            sg.API(request, function (error, res) {
                if (error) {
                    response.error(error);
                }
                response.success(res);
            });
        }
        else {
            response.error("sendgrid Key not found");
        }
    },
    function (error) {
        response.error(error);
    });

});






