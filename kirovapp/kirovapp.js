// Set up a collection to contain player information. On the server,
// it is backed by a MongoDB collection named "players".

AllMeals = new Meteor.Collection("allMeals");
SelectedMeals = new Meteor.Collection("myMeals");
Counts = new Meteor.Collection("counts");
SelectedMeals.allow({
	insert : function(userId, doc){
	console.log((null !== userId));
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
		
	Meteor.subscribe("allMeals");
	Meteor.autorun(function () {
		Meteor.subscribe("myMeals", Meteor.userId());
	});
	Meteor.subscribe("counts");
	
	
	Template.meallist.players = function () {
    return AllMeals.find({}, {sort: {score: -1, name: 1}});
  };
  
  Template.primaryMeal.meals = function () {
    return SelectedMeals.find();
  };
  
  Template.secondaryMeal.meals = function () {
    return SelectedMeals.find(); 
  };
 

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
				SelectedMeals.insert({primary: this, owner : Meteor.userId()}, function(err){
					if(err !== undefined && err.error === 403){ //access denied
						console.log("Please login");  //TODO jamz
						return;
					}
				});
				var secondaryMealWithSameName = SelectedMeals.findOne({"secondary._id" : this._id});
				if(secondaryMealWithSameName != undefined ){
					console.log(secondaryMealWithSameName);
					SelectedMeals.update({_id : secondaryMealWithSameName._id}, {$unset : {secondary : 1 }});
				}
				
			}
			console.log('left')
            break;
        case 2:
            console.log("Current room has " + Counts.findOne() + " messages.");
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
		SelectedMeals.remove({_id : this._id});
	}
  });
  Template.secondaryMeal.events({
	'click .detail' : function(event){
		console.log(SelectedMeals.findOne({"secondary._id" : this._id}));
		SelectedMeals.update({_id : this._id}, {$unset : {secondary : 1}}); 
	}
});
  
  
}




// On server startup, create some players if the database is empty.
if (Meteor.isServer) {
  Meteor.startup(function () {
 // SelectedMeals.remove({});
    if (AllMeals.find().count() === 0) {
      var names = ["Супа топчета",
                   "Пилешка супа",
                   "Лазаня",
                   "Мания с чушки",
                   "Мания със зеле",
                   "Кюфтета с гарнитура"];
      for (var i = 0; i < names.length; i++)
        AllMeals.insert({name: names[i], score: Math.floor(Random.fraction()*10)*5});
    }
  });
  Meteor.publish("allMeals", function () {
	return AllMeals.find({});
  });
  Meteor.publish("myMeals", function (userId) {
	return SelectedMeals.find({owner : userId});
  });

    var ordersMap = {};
    var allMealsCursor = SelectedMeals.find({});
    console.log("Starting modofoka");
    allMealsCursor.forEach(function(meal){
        if(ordersMap.hasOwnProperty(meal.primary.name)){
            ordersMap[meal.primary.name] += 1;
        }else{
            ordersMap[meal.primary.name] = 1;
        }
    });
    console.log("Ending modofoka");
    console.log(ordersMap);
   // server: publish the current size of a collection
 Meteor.publish("counts", function () {
    var self = this;
    var uuid = Meteor.uuid();
    var count = 0;
    var initializing = true;

    var handle = SelectedMeals.find({}).observeChanges({
        added: function (doc, idx) {

            console.log("adding")
            console.log(initializing);
            console.log(idx);
            if (!initializing) {
                if( ordersMap.hasOwnProperty(idx.primary.name)) { //? ( ordersMap[doc.primary.name]+=1 ) : ( ordersMap[doc.primary.name] = 1 )
                    ordersMap[idx.primary.name] += 1;
                }else{
                    ordersMap[idx.primary.name] = 1;
                }
                self.changed("counts", uuid, ordersMap);
            }
        },
        removed: function (doc, idx) {
            count--;
            self.changed("counts", uuid, {
                count: count
            });
        } 
        // don't care about moved or changed
    });

    initializing = false;

    // publish the initial count.  observeChanges guaranteed not to return
    // until the initial set of `added` callbacks have run, so the `count`
    // variable is up to date.
    self.added("counts", uuid, ordersMap);

    // and signal that the initial document set is now available on the client
    self.ready();

    // turn off observe when client unsubs
    self.onStop(function () {
        handle.stop();
    });
});
  
  
}
