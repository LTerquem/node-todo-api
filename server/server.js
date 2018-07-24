const express = require("express");
const bodyParser = require("body-parser");

const {mongoose} = require("./db/mongoose");
const {Todo} = require("./models/Todo");
const {User} = require("./models/User");

var app = express();

app.use(bodyParser.json());

app.post("/todos", (req, res) => {
	var todo = new Todo({
		text: req.body.text
	});
	todo.save()//err => res.send(err));
		.then( doc => res.send(doc))
		.catch( err => res.status(400).send(err));
})

app.listen(3000, () => {
	console.log("Started on port 3000");
})