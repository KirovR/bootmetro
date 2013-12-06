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

  Template.secondaryMeal.meals = function () {
    return SelectedMeals.find({removed : false});
  };

    Template.allMealsToOrder.meals = function(){
        return AllMeals.find({orderQuantity : {$gt : 0}}, {sort: {score: -1, name: 1}});
    }

  Template.player.events({
    'click': function () {
     // Session.set("selected_player", this._id);
    },
	'mousedown' : function(event){
		 switch (event.which) {
        case 1:
			if(SelectedMeals.find({"primary._id" : this._id}).fetch().length == 0){
			//console.log(totalOrders);
				//var that =  jQuery.extend(true, {}, this);
				SelectedMeals.insert({primary: this, owner : Meteor.userId(), removed : false}, function(err){
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
		SelectedMeals.update({_id : this._id}, {$set : {removed : true}});
	}
  });
  Template.secondaryMeal.events({
	'click .detail' : function(event){
		SelectedMeals.update({_id : this._id}, {$unset : {secondary : 1}}); 
	}
});
  
  
}




// On server startup, create some players if the database is empty.
if (Meteor.isServer) {
  Meteor.startup(function () {
 // SelectedMeals.remove({});
    if (AllMeals.find().count() === 0) {
      var names = ["пилешка супа", "шкембе чорба", "боб чорбa", "агнешка курбан чорба", "крем супа от моркови", "супа топчета", "пица с черно тесто с бекон и кашкавал- малка", "пица с черно тесто с бекон и кашкавал- голяма", "сурова туршия", "айдемирска салата(кисело зеле,бекон,червен пипер на тиган)", "агнешко печено на пещ с дроб сарма и зелена салата", "бирено бутче със задушени бейби картофи", "пилешки кюфтета с пържени картофи и лютеница", "пълнени сухи чушки с боб", "задушени зеленчуци на фурна в зехтин", "свински мръвки с праз лук и ориз", "запечени кренвирши с кашкавал и гарнитура", "пържени кюфтета с пържени картофи и лютеница", "домашна баница със праз и сирене", "пълнени палачинки с пилешко филе и зеленчуци", "свинско печено на пещ с картофено пюре и печен сос", "задушени картофи на фурна", "сръбско руло със зелена салата", "сирене по шопски на пещ", "огретен от тиквички", "пълнени чушки", "свинско с кисело зеле", "кашкавал на фурна", "зелник на пещ в тесто", "кюфтета по чирпански", "боб яхния", "мозък пане", "пиле женева", "свинско винен кебап", "пилешка кавърма", "мусака", "спанак с ориз", "руло стефани", "леща яхния", "дроб сарма", "пиле с ориз", "боб с наденица", "боб със зеле", "мозък в масло"];
      for (var i = 0; i < names.length; i++)
        AllMeals.insert({name: names[i], score: ( Math.floor(Random.fraction()*10)*5 ), orderQuantity: 0, removed: false});
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
                 var primaryOrderedMeal =idx.primary._id;
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

  
  
}
