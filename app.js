//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-aneesh:test123@cluster0.gdlh3lw.mongodb.net/todolistDB", {useNewUrlParser:true});

const itemsSchema = {
  name:String
}

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name:"welcome to your to do list"
})

const item2 = new Item({
  name:"Hit the + button to add the new item"
})

const item3 = new Item({
  name:"<-- hit this to delete the item"
})

// const items = ["Buy Food", "Cook Food", "Eat Food"];
const defaultItems = [item1,item2,item3];

const listSchema = {
  name:String,
  items:[itemsSchema]
}

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  Item.find({}).then(function(foundItems){

    // here handling with the duplicates and whn to add and not to add items
    if( foundItems.length === 0){
        Item.insertMany(defaultItems); 
        // here if we dont have any items them we will redirect to the home route and after going to else we will add the items into the list
        res.redirect("/");
    }
    else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
    
    
  });
 
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  // here when we post something in our todo list we will save it to the home and in our db
  const item = new Item ({
    name:itemName
  })

  if(listName === "Today"){
    // save item to db
    item.save();
    // now to show the item in our home that is saved to our db we will only redirect ti the home route
    res.redirect("/");  
  }
  else{
    List.findOne({name:listName}).then(function(foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }


});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName; 
  // if we are deleting from the defalut list
  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId).then(function(err){
      if(!err){
        console.log("success1!!");
      }
      res.redirect("/");
    });
  }
  // if the list is not default
  else{
     List.findOneAndUpdate({name:listName}, {$pull: {items:{_id: checkedItemId}}}).then(function(foundList){
      res.redirect("/" + listName);
     });
  }

  
})

// app.get("/work", function(req,res){
//   res.render("list", {listTitle: "Work List", newListItems: workItems});
// });

app.get("/:customListName", async function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  try {
    const foundList = await List.findOne({ name: customListName });

    if (!foundList) {
      // If we don't find any list, then create the new one
      const list = new List({
        name: customListName,
        items: defaultItems
      });

      await list.save();
      res.redirect("/" + customListName);
    } else {
      // Show an existing list
      res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
    }
  } catch (err) {
    console.log(err);
    // Handle errors appropriately, like displaying an error page or redirecting to an error route.
  }
});


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
