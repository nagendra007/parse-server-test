
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
   

    gateway.transaction.sale({
        amount: "4.00",
        paymentMethodNonce: request.params.nonce,
        //CustomerId : balcustomerid,
       // PaymentMethodToken : cardid,
        options: {
            submitForSettlement: true
        }
    }, function (err, result) {
        response.success("Purchase made!");
    });
});

Parse.Cloud.define("addBraintreeCreditCard", function (request, response) {
    if (request.params.CardholderName != null && request.params.CardholderName != "" && request.params.Number != null && request.params.Number != "" && request.params.CVV != null && request.params.CVV != "" && request.params.ExpirationMonth != null && request.params.ExpirationMonth != "" && request.params.ExpirationYear != null && request.params.ExpirationYear != "") {//if (request.params.nonce != null && request.params.nonce != "" ) {
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
        response.error("provide nonce");
    }
});


Parse.Cloud.define("pay", function(request, response) {
	
    var Stripe = require("stripe");
    Stripe.initialize("sk_test_n2S4djhAGVIPM8C2oQuNzPF8");
    Stripe.Customers.create({
    card: request.params.token,
    plan: request.params.plan,
    quantity: request.params.quantity
    // coupon: request.params.coupon, 
    // email: request.params.email

    },{
    success: function(httpResponse) {
        response.success("Purchase made!");
    },
    error: function(httpResponse) {
        response.error("Error: "+httpResponse.message+"\n"+
               "Params:\n"+
               request.params.token+","+
               request.params.plan+","+
               request.params.quantity+
               "\n"
              );
    }
    });
});


