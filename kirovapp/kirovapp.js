// Set up a collection to contain player information. On the server,
// it is backed by a MongoDB collection named "players".

AllMeals = new Meteor.Collection("allMeals");
SelectedMeals = new Meteor.Collection("myMeals");

AllMeals.allow({
    update : function(userId, doc, fields, modifier){
        return !_.difference(["orderQuantity"], fields).length
    }

});

SelectedMeals.allow({
	insert : function(userId, doc){
		return (null !== userId);
	},
	update : function(userId, doc, fields, modifier){
		return doc.owner === userId;
	},
	remove : function(userId, doc){
		return ( doc.owner === userId ) ;
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
		
	Meteor.subscribe("allMeals");
	Meteor.autorun(function () {
		Meteor.subscribe("myMeals", Meteor.userId());
	});
	
	
	Template.meallist.players = function () {
    return AllMeals.find({}); //, {sort: {score: -1, name: 1}});
  };
  
  Template.primaryMeal.meals = function () {
    return SelectedMeals.find({removed : false});
  };
  Template.kur.options = function () {
      var selected = Session.get("SelectedPrimaryMeal")
      return SelectedMeals.find({removed: false, secondary: {$exists: true}, _id : {$ne : selected}});
  }
//  Template.secondaryMeal.meals = function () {
//    return SelectedMeals.find({removed : false});
//  };

    Template.allMealsToOrder.meals = function(){
        return AllMeals.find({orderQuantity : {$gt : 0}}, {sort: {orderQuantity: -1, name: 1}});
    }
    Template.allMealsToOrder.events({
        'click' : function(event){
             Meteor.call("missingMeal", this._id, function (error, result){
                 console.log(result);
             });

        }
    });
    var colorStack = ["#FFFFFF", "#F0AD4E", "#5BC0DE", "#5CB85C","#D9534F","#428BCA"];

  Template.player.events({
    'click .noMeal': function () {
     // Session.set("selected_player", this._id);
    },
	'mousedown' : function(event){
		 switch (event.which) {
        case 1:
			if(SelectedMeals.find({"primary._id" : this._id}).fetch().length == 0){
			//console.log(totalOrders);
				//var that =  jQuery.extend(true, {}, this);
                var colorForTheMeal = colorStack.pop();
                SelectedMeals.findOne({color: {}})
				SelectedMeals.insert({primary: this, color : colorForTheMeal, owner : Meteor.userId(), removed : false}, function(err){
					if(err !== undefined && err.error === 403){ //access denied
						console.log("Please login");  //TODO jamz
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
            console.log( Counts.findOne());
              break;
        case 3:
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
        console.log("mahnah");
	},
    'click .detailSecondary' : function(){
        SelectedMeals.update({_id : this._id}, {$unset : {secondary : 1}});
    },
    'click .caret' : function(event){
      //  console.log(this._id);
        Session.set("SelectedPrimaryMeal", this._id);
    }
  });
//  Template.secondaryMeal.events({
//	'click .detail' : function(event){
//		SelectedMeals.update({_id : this._id}, {$unset : {secondary : 1}});
//	}
//});
    Template.kur.events({
        'click .secondaryAlternative' : function(event){
            var parentToChangeId = $(event.target).closest(".tile-listviewitem").attr("primaryMealId");
            console.log(  event.target);
            var currentSecondaryMeal = SelectedMeals.findOne({_id : parentToChangeId}).secondary;
            SelectedMeals.update({_id : parentToChangeId}, {$set :{secondary : this.secondary}});
            SelectedMeals.update({_id : this._id}, { $set: { secondary : currentSecondaryMeal }});
        }
    });
  
  
}




// On server startup, create some players if the database is empty.
if (Meteor.isServer) {
   Meteor.startup(function () {
      collectionApi = new CollectionAPI({
          authToken: undefined,              // Require this string to be passed in on each request
          apiPath: 'collectionapi',          // API path prefix
          standAlone: false,                 // Run as a stand-alone HTTP(S) server
          sslEnabled: false,                 // Disable/Enable SSL (stand-alone only)
          listenPort: 3005,                  // Port to listen to (stand-alone only)
          listenHost: undefined,             // Host to bind to (stand-alone only)
          privateKeyFile: undefined,  // SSL private key file (only used if SSL is enabled)
          certificateFile: undefined // SSL certificate key file (only used if SSL is enabled)
      });


 // SelectedMeals.remove({});
    if (AllMeals.find().count() === 0) {
      var names = [{ price: 2.49, removed: false, orderQuantity:0,   name: 'АГНЕШКА КУРБАН ЧОРБА'				                                                                                                             }, { price: 1.99, removed: false, orderQuantity:0,   name: 'СУПА ТОПЧЕТA'			                                                                                                                         }, { price: 1.99, removed: false, orderQuantity:0,   name: 'ТАРАТОР'		                                                                                                                                 }, { price: 1.99, removed: false, orderQuantity:0,   name: 'ПИЛЕШКА СУПА'			                                                                                                                         }, { price: 2.49, removed: false, orderQuantity:0,   name: 'ШКЕМБЕ ЧОРБА'			                                                                                                                         }, { price: 1.49, removed: false, orderQuantity:0,   name: 'БОБ ЧОРБА'			                                                                                                                             }, { price: 3.99, removed: false, orderQuantity:0,   name: 'ПИЦА С ЧЕРНО ТЕСТО С ПИЛЕШКО ФИЛЕ И ЦАРЕВИЦА  - МАЛКА'                                                                                          }, { price: 4.99, removed: false, orderQuantity:0,   name: 'ПИЦА С ЧЕРНО ТЕСТО С ПИЛЕШКО ФИЛЕ И ЦАРЕВИЦА  - ГОЛЯМА'									                                                     }, { price: 2.99, removed: false, orderQuantity:0,   name: 'САЛАТА КИСЕЛИ КРАСТАВИЧКИ ОТ ТУРШИЯ'				                                                                                             }, { price: 2.99, removed: false, orderQuantity:0,   name: 'СУРОВА ТУРШИЯ'			                                                                                                                         }, { price: 3.99, removed: false, orderQuantity:0,   name: 'АЙДЕМИРСКА САЛАТА(кисело зеле, бекон, червен пипер на тиган)'                 }, { price: 5.99, removed: false, orderQuantity:0,   name: 'ТЕЛЕШКИ КЕБАПЧЕНЦА С БЯЛ ОРИЗ, КИС. КРАСТ. И ЛЮТЕНИЦА'							                             }, { price: 4.49, removed: false, orderQuantity:0,   name: 'ПИЛЕШКИ КЮФТЕТА С ПЪРЖЕНИ КАРТОФИ И ЛЮТЕНИЦА'						                                                                             }, { price: 4.29, removed: false, orderQuantity:0,   name: 'ПЪРЖЕН ШНИЦЕЛ С КАРТОФЕНА САЛАТА И ЛЮТЕНИЦА'								                                                                     }, { price: 6.99, removed: false, orderQuantity:0,   name: 'СВИНСКО ПЕЧЕНО НА ПЕЩ С КАРТОФЕНО ПЮРЕ И ГЪБЕН СОС'									                                                         }, { price: 5.99, removed: false, orderQuantity:0,   name: 'ПИЛЕШКО ФИЛЕ С ТОПЕНО СИРЕНЕ, СМЕТАНА И КИС. КРАСТАВИЧКИ'									                     }, { price: 5.49, removed: false, orderQuantity:0,   name: 'СВИНСКИ МРЪВКИ ПО СЕЛСКИ'									                                                                                     }, { price: 3.99, removed: false, orderQuantity:0,   name: 'КЮФТЕТА ПО ЦАРИГРАДСКИ С КАРТОФЕНО ПЮРЕ'									                                                                     }, { price: 3.69, removed: false, orderQuantity:0,   name: 'ПЪЛНЕНИ ЧУШКИ С БОБ'									                                                                                         }, { price: 5.99, removed: false, orderQuantity:0,   name: 'СВИНСКО КЪЛЦАНО В ТЕСТО'									                                                                                     }, { price: 3.49, removed: false, orderQuantity:0,   name: 'ЗАДУШЕНИ КАРТОФИ НА ФУРНА'									                                                                                     }, { price: 3.99, removed: false, orderQuantity:0,   name: 'БОБ С НАДЕНИЦА'									                                                                                             }, { price: 3.99, removed: false, orderQuantity:0,   name: 'ДРОБ СЪРМА'				                                                                                                                     }, { price: 3.99, removed: false, orderQuantity:0,   name: 'МУСАКА'				                                                                                                                         }, { price: 3.99, removed: false, orderQuantity:0,   name: 'СВИНСКО С КИСЕЛО ЗЕЛЕ'				                                                                                                             }, { price: 3.69, removed: false, orderQuantity:0,   name: 'КАРТОФЕНИ КЮФТЕТА'				                                                                                                                 }, { price: 3.99, removed: false, orderQuantity:0,   name: 'ПИЛЕ ФРИКАСЕ'				                                                                                                                     }, { price: 3.99, removed: false, orderQuantity:0,   name: 'ЗЕЛЕВИ САРМИ'				                                                                                                                     }, { price: 6.99, removed: false, orderQuantity:0,   name: 'МОЗЪК В МАСЛО'				                                                                                                                     }, { price: 2.99, removed: false, orderQuantity:0,   name: 'ЛЕЩА ЯХНИЯ'			                                                                                                                         }, { price: 3.99, removed: false, orderQuantity:0,   name: 'РУЛО СТЕФАНИ'			                                                                                                                         }, { price: 4.29, removed: false, orderQuantity:0,   name: 'СВИНСКА КАВАРМА'			                                                                                                                     }, { price: 3.69, removed: false, orderQuantity:0,   name: 'КАРТОФЕН ПАЙ С КАЙМА'			                                                                                                                 }, { price: 2.99, removed: false, orderQuantity:0,   name: 'БОБ ЯХНИЯ'			                                                                                                                             }, { price: 3.99, removed: false, orderQuantity:0,   name: 'ПИЛЕ С ОРИЗ'		                                                                                                                             }, { price: 6.99, removed: false, orderQuantity:0,   name: 'МОЗЪК ПАНЕ'		                                                                                                                             }];
        for (var i = 0; i < names.length; i++)

        AllMeals.insert(names[i]);
    }
  });
  Meteor.publish("allMeals", function () {
	return AllMeals.find({});

  });
  Meteor.publish("myMeals", function (userId) {
	return SelectedMeals.find({owner : userId});
  });


  SelectedMeals.find({}).observeChanges({
         added: function (doc, idx) {
                 var primaryOrderedMeal = idx.primary._id;
                 AllMeals.update({_id : primaryOrderedMeal}, {$inc : {orderQuantity : 1 } });

         },
         changed: function(doc, fields){
           console.log(fields);
            if(fields.hasOwnProperty("removed")){
                var deletedMealId = SelectedMeals.findOne({_id: doc}).primary._id
                AllMeals.update({_id : deletedMealId}, {$inc : {orderQuantity : -1 } });
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
            var secondaryMealToOrder =  SelectedMeals.findOne({"primary._id" : primaryMealId, processed : {$exists : false} , secondary : { $exists : true } }, {sort: {secondary: 1}});
            if(undefined === secondaryMealToOrder)
            {
                secondaryMealToOrder =  SelectedMeals.findOne({"primary._id" : primaryMealId, processed : {$exists : false}}, {sort: {secondary: 1}});
            }
            SelectedMeals.update({_id : secondaryMealToOrder._id}, {$set : {processed: true}});
            SelectedMeals.update({_id : secondaryMealToOrder._id}, {$set : {"primary.ordered" : false}});
            if (undefined === secondaryMealToOrder.secondary){
                AllMeals.update({_id : primaryMealId}, {$push: {orderNotes : ["Няма второ, продължавай"]}});
                return "Няма второ, продължавай";
            }else{
                 AllMeals.update({_id : primaryMealId}, {$push: {orderNotes  : secondaryMealToOrder.secondary.name}});
                 return secondaryMealToOrder.secondary.name;
            }

        }
    });

  
  
}
