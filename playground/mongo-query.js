const {ObjectID} = require("mongodb");

const {mongoose} = require("./../server/db/mongoose");
const {User} = require("./../server/models/user");

const id = "5b56d37efd7d53409ce6c0d2";

if(!ObjectID.isValid(id)) {
	return console.log("Invalid ID");
}

User.findById(id).then(res => {
	if(!res) {
		return console.log("No user found");
	}
	console.log(res);
})