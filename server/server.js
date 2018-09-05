require("./../config/config");

const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const bcrypt = require("bcryptjs")

const {ObjectID} = require("mongodb");
const {mongoose} = require("./db/mongoose");
const {Todo, getTodoById, deleteTodoById} = require("./models/todo");
const {User} = require("./models/user");
const {authenticate} = require("./middleware/authenticate");

const instructions = {
	instruction1: {
		request: "POST /todos",
		params: "text : String",
		result: "Add a todo"
	},
	instruction2: {
		request: "GET /todos",
		result: "Print all todos"
	},
	instruction3: {
		request: "GET /todos/ID",
		params: "ID as a valid ObjectID",
		result: "Print the todo witch matching ID"
	}
}

var app = express();

const port = process.env.PORT;

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

app.delete("/todos", (req, res) => {
	Todo.remove({}).then(docs => res.send(`${docs.n} todos have been removed !`));
});

app.delete("/todos/:id", (req, res) => {
	deleteTodoById(req.params.id)
		.then(todo => {
			return res.status(todo.statusCode).send(todo.body);
		});
});

app.patch("/todos/:id", (req, res) => {
	var id = req.params.id;
	var body = _.pick(req.body, ["text", "completed"]);

	if(!ObjectID.isValid(id)) {
		return res.status(404).send();
	}

	if (_.isBoolean(body.completed) && body.completed) {
		body.completedAt = new Date().getTime();
	} else {
		body.completed = false;
		body.completedAt = null;
	}
	Todo.findByIdAndUpdate(id,  {$set: body}, {new: true}).then( todo => {
		if(!todo) {
			return res.status(404).send();
		}
		res.send({todo});
	}).catch( err => res.status(400).send());
});

app.post("/users", (req, res) => {
	var body = _.pick(req.body, ["email", "password"]);
	var user = new User(body);	
	user.save()
		.then( () => user.generateAuthToken())
		.then( token => res.header("x-auth", token).send(user))
		.catch(err => res.status(400).send(err))
});

app.post("/users/login", (req, res) => {
	var body = _.pick(req.body, ["email", "password"]);
	User.findByCredentials(body.email, body.password).then( user => {
		return user.generateAuthToken()
			.then( token => res.header("x-auth", token).send(user))
	}).catch(err => {
		res.status(400).send(err);
	});
})

app.delete("/users/logout", authenticate, (req, res) => {
	req.user.removeAuthToken(req.token)
		.then( () => res.status(200).send("User logged out"))
		.catch( e => res.status(400).send(e))
})

app.get("/users/me", authenticate,  (req, res) => {
	res.send(req.user);
});

app.listen(port, () => {
	console.log(`Started on port ${port}`);
})

module.exports = {app};