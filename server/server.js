const express = require("express");
const bodyParser = require("body-parser");

const {ObjectID} = require("mongodb");
const {mongoose} = require("./db/mongoose");
const {Todo, getTodoById} = require("./models/todo");
const {User} = require("./models/user");

const instructions = {
	instruction: {
		request: "POST /todos",
		params: "text : String",
		result: "Add a todo"
	},
	instruction: {
		request: "GET /todos",
		result: "Print all todos"
	},
	instruction: {
		request: "GET /todos/ID",
		params: "ID as a valid ObjectID",
		result: "Print the todo witch matching ID"
	}
}

var app = express();

const port = process.env.PORT ||3000;

app.use(bodyParser.json());

app.get("/", (req, res) => res.send(JSON.stringify(instructions, undefined, 4)));

app.post("/todos", (req, res) => {
	var todo = new Todo({
		text: req.body.text
	});
	todo.save()//err => res.send(err));
		.then( doc => res.send(doc))
		.catch( err => res.status(400).send(err));
});

app.get("/todos", (req, res) => {
	Todo.find()
		.then( todos => res.send({todos}))
		.catch( err => res.send(err));
});

app.get("/todos/:id", (req, res) => {

	getTodoById(req.params.id)
		.then(todo => {
			return res.status(todo.statusCode).send(todo.body);
		});
});

app.listen(port, () => {
	console.log(`Started on port ${port}`);
})

module.exports = {app};