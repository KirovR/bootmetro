AllMeals = new Meteor.Collection("allMeals");
SelectedMeals = new Meteor.Collection("myMeals");
GlobalOptions = new Meteor.Collection("GlobalOptions");

AllMeals.allow({
    update : function(userId, doc, fields, modifier){
        return !_.difference(["orderQuantity"], fields).length
    }
});

SelectedMeals.allow({
	insert : function(userId, doc){
		return (!GlobalOptions.findOne().ordersLocked && (null !== userId));
	},
	update : function(userId, doc, fields, modifier){
		return (!GlobalOptions.findOne().ordersLocked && (doc.owner === userId));
	},
	remove : function(userId, doc){
		return (!GlobalOptions.findOne().ordersLocked && ( doc.owner === userId )) ;
	}
});
if (Meteor.isClient) {
   // Meteor.subscribe("totalOrders");

    Handlebars.registerHelper('arrayify',function(obj){
        result = [];
        for (var key in obj) {
            if('_id' !== key)
                result.push({name:key,quantity:obj[key]})
        };
        return result;
    });
    Handlebars.registerHelper('secondaryMealsLeft',function(total, orderedlist){
        return total- (orderedlist !== undefined ? orderedlist.length : 0);
    });

    Handlebars.registerHelper('if_eq', function(meal, opts){
        var leftMeals =  meal.orderQuantity - (meal.orderNotes !== undefined ? meal.orderNotes.length : 0);
        return leftMeals > 0 ? opts.fn(this) : opts.inverse(this);
    });

    Meteor.subscribe("GlobalOptions");
	Meteor.subscribe("allMeals");
	Meteor.autorun(function () {
		Meteor.subscribe("myMeals", Meteor.userId());
	});

    Template.titleTemplate.options = function () {
        return GlobalOptions.findOne();
    };
	Template.meallist.meals = function () {
         return AllMeals.find({}); //, {sort: {score: -1, name: 1}});
    };
  
  Template.primaryMeal.meals = function () {
    return SelectedMeals.find({removed : false});
  };
  Template.secondaryAlternative.options = function () {
      var selected = Session.get("SelectedPrimaryMeal")
      return SelectedMeals.find({removed: false, secondary: {$exists: true}, _id : {$ne : selected}});
  }

    Template.headerTitle.options = function(){
        return GlobalOptions.findOne();
    }
    Template.cssBackground.options = function(){
        return GlobalOptions.findOne();
    }
    Template.allMealsToOrder.meals = function(){
        return AllMeals.find({orderQuantity : {$gt : 0}}, {sort: {orderQuantity: -1, name: 1}});
    }
    Template.allMealsToOrder.mealsExist = function(){
        return ((AllMeals.find({orderQuantity : {$gt : 0}}).fetch().length > 0) ? true : false );
    }
    Template.allMealsToOrder.isUserAdmin = function(){
        var user = Meteor.user();
        return (user != null && user.profile != undefined && user.profile.isadmin) ? true : false;
    }
    Template.allMealsToOrder.ordersLocked = function(){
          return   GlobalOptions.findOne();
    }


    Template.allMealsToOrder.events({
        'click .noMeal' : function(event){
             Meteor.call("missingMeal", this._id, function (error, result){
             });
        },
        'click #hiddenOrderManiq' : function(event){
            Meteor.call("getRandomVic", function(error, result){
                $("#asdf").html(result);
                $("#hiddenOrderManiq").remove();
            })
        },
        'click #lockOrders' : function(event){
            Meteor.call("lockOrders");
        }

    });
    $(".closeKirovdialog").click(function(){
        $("#alerts-container").remove();
    });
    //haha beat this QA tester :D
    var colorStack = ['#00FFFF', '#7FFFD4',  '#000000', '#FFEBCD', '#0000FF', '#8A2BE2', '#A52A2A', '#DEB887', '#5F9EA0', '#7FFF00', '#D2691E', '#FF7F50', '#6495ED',  '#DC143C', '#00FFFF', '#00008B', '#008B8B', '#B8860B', '#A9A9A9', '#006400', '#BDB76B', '#8B008B', '#556B2F', '#FF8C00', '#9932CC', '#8B0000', '#E9967A', '#8FBC8F', '#483D8B', '#2F4F4F', '#00CED1', '#9400D3', '#FF1493', '#00BFFF', '#696969', '#1E90FF', '#B22222',  '#228B22', '#FF00FF', '#FFD700', '#DAA520', '#808080', '#008000', '#ADFF2F', '#FF69B4', '#CD5C5C', '#4B0082',  '#F0E68C', '#7CFC00', '#FFFACD', '#ADD8E6', '#F08080', '#E0FFFF', '#FAFAD2', '#D3D3D3', '#90EE90', '#FFB6C1', '#FFA07A', '#20B2AA', '#87CEFA', '#778899', '#B0C4DE', '#FFFFE0', '#00FF00', '#32CD32', '#FAF0E6', '#FF00FF', '#800000', '#66CDAA', '#0000CD', '#BA55D3', '#9370DB', '#3CB371', '#7B68EE', '#00FA9A', '#48D1CC', '#C71585', '#191970', '#F5FFFA', '#FFE4E1', '#FFE4B5', '#FFDEAD', '#000080', '#FDF5E6', '#808000', '#6B8E23', '#FFA500', '#FF4500', '#DA70D6', '#EEE8AA', '#98FB98', '#AFEEEE', '#DB7093', '#FFEFD5', '#FFDAB9', '#CD853F', '#FFC0CB', '#DDA0DD', '#B0E0E6', '#800080', '#FF0000', '#BC8F8F', '#4169E1', '#8B4513', '#FA8072', '#F4A460', '#2E8B57', '#FFF5EE', '#A0522D', '#C0C0C0', '#87CEEB', '#6A5ACD', '#708090', '#FFFAFA', '#00FF7F', '#4682B4', '#D2B48C', '#008080', '#D8BFD8', '#FF6347', '#40E0D0', '#EE82EE', '#F5DEB3',  '#FFFF00', '#9ACD32', "#FFFFFF", "#F0AD4E", "#5BC0DE", "#5CB85C","#D9534F","#428BCA"];

  Template.displayMealToOrder.events({
	'mousedown' : function(event){
		 switch (event.which) {
        case 1:
            var loggedInUser = Meteor.user();
            if(loggedInUser == null || loggedInUser.profile != undefined && loggedInUser.profile.isadmin){
                break;
            }
			if(SelectedMeals.find({"primary._id" : this._id}).fetch().length == 0){
				//var that =  jQuery.extend(true, {}, this);
                var colorForTheMeal = colorStack.pop();
                SelectedMeals.findOne({color: {}})
				SelectedMeals.insert({primary: this, color : colorForTheMeal, owner: loggedInUser._id, ownerName: loggedInUser.emails[0].address,   removed : false}, function(err){
					if(err !== undefined && err.error === 403){ //access denied
						return;
					}
				});
				var secondaryMealWithSameName = SelectedMeals.findOne({"secondary._id" : this._id});
				if(secondaryMealWithSameName != undefined ){
					SelectedMeals.update({_id : secondaryMealWithSameName._id}, {$unset : {secondary : 1 }});
				}
				
			}
            break;
        case 2:
              break;
        case 3:
            var loggedInUser = Meteor.user();
            if(loggedInUser == null || loggedInUser.profile != undefined && loggedInUser.profile.isadmin){
                break;
            }
			if( SelectedMeals.find({ $or : [ {"primary._id" : this._id}, {"secondary._id" : this._id} ] }).fetch().length > 0 ){
				break;
			}
			var primaryMeal = SelectedMeals.findOne({ "secondary" : { $exists : false } });  
			if(primaryMeal){
				var that =  jQuery.extend(true, {}, this);
				that.userAssigned = false;
				SelectedMeals.update({_id : primaryMeal._id }, {$set : {secondary : this} }); 
			} 
            break;
        default:
            alert('You have a strange mouse. What kind of sorcery is this');
    }
	}
  });
  
  Template.primaryMeal.events({
	'click .detail' : function(event){
		var freePrimaryMeal = SelectedMeals.findOne({ "secondary" : { $exists : false }, "primary._id" : {$nin : [this.secondary === undefined ? '' : this.secondary._id]} });
		if(freePrimaryMeal){
			SelectedMeals.update({_id : freePrimaryMeal._id }, {$set : {secondary : this.secondary} }); 
		}
        colorStack.push(this.color);
		SelectedMeals.update({_id : this._id}, {$set : {removed : true}});
	},
    'click .detailSecondary' : function(){
        SelectedMeals.update({_id : this._id}, {$unset : {secondary : 1}});
    },
    'click .caret' : function(event){
        Session.set("SelectedPrimaryMeal", this._id);
    }
  });
//  Template.secondaryMeal.events({
//	'click .detail' : function(event){
//		SelectedMeals.update({_id : this._id}, {$unset : {secondary : 1}});
//	}
//});
    Template.secondaryAlternative.events({
        'click .secondaryAlternative' : function(event){
            var parentToChangeId = $(event.target).closest(".tile-listviewitem").attr("primaryMealId");
            var currentSecondaryMeal = SelectedMeals.findOne({_id : parentToChangeId}).secondary;
            SelectedMeals.update({_id : parentToChangeId}, {$set :{secondary : this.secondary}});
            if(undefined != currentSecondaryMeal && "undefined" != currentSecondaryMeal) {
                SelectedMeals.update({_id: this._id}, { $set: { secondary: currentSecondaryMeal }});
            }else{
                SelectedMeals.update({_id: this._id}, { $unset: { secondary: ""} });
            }
        }
    });

    Template.listAlternativeMeals.events({
        'click' : function(event){
            var user = Meteor.user();
            if(null == user || user.profile == undefined || !user.profile.isadmin){
                return;
            }
            Meteor.call("missingSecondaryMeal", this.id, this._uuid,  function (error, result){
            });
        }
    });

    Template.addMealTemplate.events({
        'click #activateAddMeal' : function(event){
            var loggedInUser = Meteor.user();
            if(loggedInUser == null || loggedInUser.profile != undefined && loggedInUser.profile.isadmin){
                return;
            }
            $("#mealNameInput, #mealPriceInput").val('');
            setTimeout(function() { $("#mealNameInput").focus()}, 40);
            $("#displayAddMeal").removeClass("hideElement");

        },
        'click #overlay' : function(event){
            $("#displayAddMeal").addClass("hideElement");
        },
        'click #addMealBtn' : function(event){
            var loggedInUser = Meteor.user();
            if(loggedInUser == null || loggedInUser.profile != undefined && loggedInUser.profile.isadmin){
                return;
            }
            var price = $("#mealPriceInput").val().replace(',', '.');
            var name = $.trim($("#mealNameInput").val());
            Meteor.call("addMeal", name, price);
            $("#displayAddMeal").addClass("hideElement");
        },
        'keypress #mealPriceInput, keypress #mealNameInput': function(event){
            if(event.keyCode == 13){
                var loggedInUser = Meteor.user();
                if(loggedInUser == null || loggedInUser.profile != undefined && loggedInUser.profile.isadmin){
                    return;
                }
                var price = $("#mealPriceInput").val().replace(',', '.');
                var name = $.trim($("#mealNameInput").val());
                Meteor.call("addMeal", name, price);
                $("#displayAddMeal").addClass("hideElement");
            }
        }


    });
  
}


if (Meteor.isServer) {
   Meteor.startup(function () {

       if ( Meteor.users.find().count() === 0 ) {
           Accounts.createUser({
               email: "admin@dimitur.com",
               password: "apple1",
               profile: { isadmin: true }
           });
       }


       collectionApi = new CollectionAPI({
           authToken: '97f0ad9e24ca5e0408a269748d7fe0a0'
       });
       collectionApi.addCollection(AllMeals, 'allmeals', {
           before: {  // This methods, if defined, will be called before the POST/GET/PUT/DELETE actions are performed on the collection. If the function returns false the action will be canceled, if you return true the action will take place.
               POST: function(collectionId, obj, newValues){
                   AllMeals.remove({});
                   SelectedMeals.remove({});
                   GlobalOptions.remove({});

                   for (var i = 0; i < collectionId.meals.length; i++){
                       collectionId.meals[i].removed = false;
                       collectionId.meals[i].orderQuantity = 0;
                       collectionId.meals[i].orderId = i;
                       AllMeals.insert(collectionId.meals[i]);
                    }
                   GlobalOptions.insert(collectionId.options);
                   return false;
               },  // function(obj) {return true/false;},
               GET: undefined,  // function(collectionID, objs) {return true/false;},
               PUT: function(collection, obj, newValues){
                   if(newValues['resetOrdersLock'] != undefined ){
                       GlobalOptions.update({}, {$set: {ordersLocked : false }}, {multi: true});
                       return false;
                   }
                   if(newValues['price'] == undefined || newValues['name'] == undefined || isNaN(newValues.price) || newValues.price > 20){
                       return false;
                   }
                   var idiotProofed = {};

                   idiotProofed.price = Math.round(newValues.price*100)/100;
                   idiotProofed.name  = newValues.name.length > 60 ? newValues.name.substring(0,60) : newValues.name;
                   AllMeals.insert(idiotProofed);
                   return false;
               },  //function(collectionID, obj, newValues) {return true/false;},
               DELETE: undefined,  //function(collectionID, obj) {return true/false;}
           }

       });
       collectionApi.start();



       if (GlobalOptions.find().count() === 0){
           GlobalOptions.insert({date: "Just another day", background: 2})
       }
    //   AllMeals.remove({});
    if (AllMeals.find().count() === 0) {
      var names = [{ price: 2.49, removed: false, orderQuantity:0,   name: 'АГНЕШКА КУРБАН ЧОРБА'}, { price: 1.99, removed: false, orderQuantity:0,   name: 'СУПА ТОПЧЕТA'}, { price: 1.99, removed: false, orderQuantity:0,   name: 'ТАРАТОР'		                                                                                                                                 }, { price: 1.99, removed: false, orderQuantity:0,   name: 'ПИЛЕШКА СУПА'			                                                                                                                         }, { price: 2.49, removed: false, orderQuantity:0,   name: 'ШКЕМБЕ ЧОРБА'			                                                                                                                         }, { price: 1.49, removed: false, orderQuantity:0,   name: 'БОБ ЧОРБА'			                                                                                                                             }, { price: 3.99, removed: false, orderQuantity:0,   name: 'ПИЦА С ЧЕРНО ТЕСТО С ПИЛЕШКО ФИЛЕ И ЦАРЕВИЦА  - МАЛКА'                                                                                          }, { price: 4.99, removed: false, orderQuantity:0,   name: 'ПИЦА С ЧЕРНО ТЕСТО С ПИЛЕШКО ФИЛЕ И ЦАРЕВИЦА  - ГОЛЯМА'									                                                     }, { price: 2.99, removed: false, orderQuantity:0,   name: 'САЛАТА КИСЕЛИ КРАСТАВИЧКИ ОТ ТУРШИЯ'				                                                                                             }, { price: 2.99, removed: false, orderQuantity:0,   name: 'СУРОВА ТУРШИЯ'			                                                                                                                         }, { price: 3.99, removed: false, orderQuantity:0,   name: 'АЙДЕМИРСКА САЛАТА(кисело зеле, бекон, червен пипер на тиган)'                 }, { price: 5.99, removed: false, orderQuantity:0,   name: 'ТЕЛЕШКИ КЕБАПЧЕНЦА С БЯЛ ОРИЗ, КИС. КРАСТ. И ЛЮТЕНИЦА'							                             }, { price: 4.49, removed: false, orderQuantity:0,   name: 'ПИЛЕШКИ КЮФТЕТА С ПЪРЖЕНИ КАРТОФИ И ЛЮТЕНИЦА'						                                                                             }, { price: 4.29, removed: false, orderQuantity:0,   name: 'ПЪРЖЕН ШНИЦЕЛ С КАРТОФЕНА САЛАТА И ЛЮТЕНИЦА'								                                                                     }, { price: 6.99, removed: false, orderQuantity:0,   name: 'СВИНСКО ПЕЧЕНО НА ПЕЩ С КАРТОФЕНО ПЮРЕ И ГЪБЕН СОС'									                                                         }, { price: 5.99, removed: false, orderQuantity:0,   name: 'ПИЛЕШКО ФИЛЕ С ТОПЕНО СИРЕНЕ, СМЕТАНА И КИС. КРАСТАВИЧКИ'									                     }, { price: 5.49, removed: false, orderQuantity:0,   name: 'СВИНСКИ МРЪВКИ ПО СЕЛСКИ'									                                                                                     }, { price: 3.99, removed: false, orderQuantity:0,   name: 'КЮФТЕТА ПО ЦАРИГРАДСКИ С КАРТОФЕНО ПЮРЕ'									                                                                     }, { price: 3.69, removed: false, orderQuantity:0,   name: 'ПЪЛНЕНИ ЧУШКИ С БОБ'									                                                                                         }, { price: 5.99, removed: false, orderQuantity:0,   name: 'СВИНСКО КЪЛЦАНО В ТЕСТО'									                                                                                     }, { price: 3.49, removed: false, orderQuantity:0,   name: 'ЗАДУШЕНИ КАРТОФИ НА ФУРНА'									                                                                                     }, { price: 3.99, removed: false, orderQuantity:0,   name: 'БОБ С НАДЕНИЦА'									                                                                                             }, { price: 3.99, removed: false, orderQuantity:0,   name: 'ДРОБ СЪРМА'				                                                                                                                     }, { price: 3.99, removed: false, orderQuantity:0,   name: 'МУСАКА'				                                                                                                                         }, { price: 3.99, removed: false, orderQuantity:0,   name: 'СВИНСКО С КИСЕЛО ЗЕЛЕ'				                                                                                                             }, { price: 3.69, removed: false, orderQuantity:0,   name: 'КАРТОФЕНИ КЮФТЕТА'				                                                                                                                 }, { price: 3.99, removed: false, orderQuantity:0,   name: 'ПИЛЕ ФРИКАСЕ'				                                                                                                                     }, { price: 3.99, removed: false, orderQuantity:0,   name: 'ЗЕЛЕВИ САРМИ'				                                                                                                                     }, { price: 6.99, removed: false, orderQuantity:0,   name: 'МОЗЪК В МАСЛО'				                                                                                                                     }, { price: 2.99, removed: false, orderQuantity:0,   name: 'ЛЕЩА ЯХНИЯ'			                                                                                                                         }, { price: 3.99, removed: false, orderQuantity:0,   name: 'РУЛО СТЕФАНИ'			                                                                                                                         }, { price: 4.29, removed: false, orderQuantity:0,   name: 'СВИНСКА КАВАРМА'			                                                                                                                     }, { price: 3.69, removed: false, orderQuantity:0,   name: 'КАРТОФЕН ПАЙ С КАЙМА'			                                                                                                                 }, { price: 2.99, removed: false, orderQuantity:0,   name: 'БОБ ЯХНИЯ'			                                                                                                                             }, { price: 3.99, removed: false, orderQuantity:0,   name: 'ПИЛЕ С ОРИЗ'		                                                                                                                             }, { price: 6.99, removed: false, orderQuantity:0,   name: 'МОЗЪК ПАНЕ'		                                                                                                                             }];
        //for (var i = 0; i < names.length; i++)

       // AllMeals.insert(names[i]);
    }
  });
    Meteor.publish("GlobalOptions", function (userId) {
        return GlobalOptions.find();
    });
  Meteor.publish("allMeals", function () {
	return AllMeals.find({}, {sort : { orderId : 1}} );

  });
  Meteor.publish("myMeals", function (userId) {
	return SelectedMeals.find({owner : userId});
  });


  SelectedMeals.find({}).observeChanges({
         added: function (doc, idx) {
                 var primaryOrderedMeal = idx.primary._id;
                 AllMeals.update({_id : primaryOrderedMeal}, {$inc: {orderQuantity : 1 } });
                 AllMeals.update({_id : primaryOrderedMeal}, {$push: {orderers: idx.ownerName} })

         },
         changed: function(doc, fields){
            if(fields.hasOwnProperty("removed")){
                var deletedMeal = SelectedMeals.findOne({_id: doc});
                var deletedMealId = deletedMeal.primary._id;
                AllMeals.update({_id : deletedMealId}, {$inc : {orderQuantity : -1 } });
                AllMeals.update({_id : deletedMealId}, {$pull: {orderers: deletedMeal.ownerName} })
                SelectedMeals.remove({_id : doc});
           }
         },
         removed: function (doc) {
             var allMealsCursor = SelectedMeals.find({});

         }
         // don't care about moved or changed
     });


    Meteor.methods({

        missingMeal: function (primaryMealId) {
            var secondaryMealToOrder =  SelectedMeals.findOne({"primary._id" : primaryMealId, processed : {$exists : false} , secondary : { $exists : true } } );
            if(undefined === secondaryMealToOrder)
            {
                secondaryMealToOrder =  SelectedMeals.findOne({"primary._id" : primaryMealId, processed : {$exists : false}}, {sort: {secondary: 1}});
            }
            SelectedMeals.update({_id : secondaryMealToOrder._id}, {$set : {processed: true}});
            SelectedMeals.update({_id : secondaryMealToOrder._id}, {$set : {"primary.ordered" : false}});
            if (undefined == secondaryMealToOrder.secondary || "undefined" == secondaryMealToOrder.secondary){
                AllMeals.update({_id : primaryMealId},  { $push: {orderNotes: {name : "Няма второ", ownerName: secondaryMealToOrder.ownerName } } });
                return "Няма второ, продължавай";
            }else{
                 AllMeals.update({_id : primaryMealId}, {$push: {orderNotes  : {_uuid: Meteor.uuid(), name : secondaryMealToOrder.secondary.name,  ownerName: secondaryMealToOrder.ownerName, id: secondaryMealToOrder._id } } } );
                 return secondaryMealToOrder.secondary.name;
            }

        },
        getRandomVic: function(){
            var options = GlobalOptions.findOne({});
            return options.vic;
        },
        lockOrders: function(){
            var totalTime = 180;
            var mins, seconds, timeLeftLocal;
            GlobalOptions.update({}, {$set: {timerActivated: true}}, {multi: true});

            var timer = setInterval( Meteor.bindEnvironment(function(){
                mins = totalTime/60;
                seconds = totalTime%60;
                totalTime--;
                timeLeftLocal = '' + parseInt(mins) + ':'+String((seconds/100).toFixed(2)).substr(2,2);
                GlobalOptions.update({}, {$set: {timeLeft: timeLeftLocal}}, {multi: true});
                if(totalTime == 0){
                    clearInterval(timer);
                    GlobalOptions.update({}, {$set: {timerActivated: false}}, {multi: true});
                    GlobalOptions.update({}, {$set: {ordersLocked : true }}, {multi: true});
                }
            },function( error) {console.log( error);}) , 1000);
           // GlobalOptions.update({}, {$set: {ordersLocked : true }}, {multi: true});
        },
        missingSecondaryMeal: function(orderId, uuid){
            var order = SelectedMeals.findOne({_id: orderId});
            if(order.secondary.ordered == undefined || order.secondary.ordered == true){
                SelectedMeals.update({_id: orderId}, {$set: {"secondary.ordered": false}});
                AllMeals.update({_id:order.primary._id, "orderNotes._uuid": uuid}, {$set: {"orderNotes.$.ordered": false}})
            }else{
                SelectedMeals.update({_id: orderId}, {$set: {"secondary.ordered": true}});
                AllMeals.update({_id:order.primary._id, "orderNotes._uuid": uuid}, {$set: {"orderNotes.$.ordered": true}})
            }
        },
        addMeal : function(mealName, mealPrice){
            if(mealName.length < 1)
            {
                return false
            }
            if(mealPrice == undefined || isNaN(mealPrice) || mealPrice > 20 || mealPrice.length == 0){
                mealPrice = 13.37;
            }
            var idiotProofed = {};

            idiotProofed.price = Math.round(mealPrice*100)/100;
            idiotProofed.name  =mealName.length > 60 ? mealName.substring(0,57)+'...' : mealName;
            idiotProofed.name = idiotProofed.name.toLowerCase();
            idiotProofed.orderId = 200;

            AllMeals.insert(idiotProofed);
        }

    });



}
