const expect = require("expect");
const request = require("supertest");
const {ObjectId} = require("mongodb");

const {app} = require("./../server");
const {Todo} = require("./../models/todo");
const {User} = require("./../models/user");

const {seedTodos, populateTodos, seedUsers, populateUsers} = require("./seed/seed");

beforeEach(populateUsers);
beforeEach(populateTodos);

describe("POST /todo", () => {
	it("should create a new todo", done => {
		var text = "Test ToDo creation";
		request(app)
			.post("/todos")
			.send({text})
			.expect(200)
			.expect( res => expect(res.body.text).toBe(text))
			.end((err, res) => {
				if(err) {
					return done(err);
				}

				Todo.find()
					.then(todos => {
						expect(todos.length).toBe(3);
						expect(todos[2].text).toBe(text);
						done();
					}).catch( err => done(err));
			});
	});

	it("should not create a todo - invalid body data", done => {
		request(app)
			.post("/todos")
			.send({})
			.expect(400)
			.end( (err, res) => {
				if(err) {
					return done(err);
				}
				Todo.find()
					.then( todos => {
						expect(todos.length).toBe(2);
						done();
					}).catch( err => done(err))
			});
	});
});

describe("GET /todos", () => {
	it("should return an object with todos property ", done => {
		request(app)
			.get("/todos")
			.expect(200)
			.expect(res => expect(res.body.todos.length).toBe(2))
			.end(done);
	});

	describe("GET /todos/id", () => {
		it("should return a single Todo", done => {
			request(app)
				.get(`/todos/${seedTodos[0]._id}`)
				.expect(200)
				.expect(res => expect(res.body.todo).toBeTruthy())
				.end(done);
		});

		it("should return a 404", done => {
			request(app)
				.get(`/todos/${seedTodos[0]._id}111`)
				.expect(404)
				.expect(res => expect(res.body.todo).toBeFalsy()) //Should not return any Todos
				.expect(res => expect(res.body.errorMessage).toBeTruthy()) //Should return an error message
				.end(done);
		});

		it("should return an error message with a 200", done => {
			request(app)
				.get(`/todos/${new ObjectId()}`)
				.expect(200)
				.expect(res => expect(res.body.todo).toBeFalsy()) //Should not return any Todos
				.expect(res => expect(res.body.errorMessage).toBeTruthy())	//Should return an error message
				.end(done);
		});
	});
})

describe("DELETE /todos", () => {
	it("should delete a todo", done => {
		request(app)
			.delete(`/todos/${seedTodos[0]._id}`)
			.expect(200)
			.end(res => {
				Todo.find().then(todos => {
					expect(todos.length).toBe(1);
					expect(todos[0].text).toBe("second test todo");
				Todo.findById(seedTodos[0]._id).then(todo => expect(todo).toBeNull());
				});
				done();
			});
	});

	it("should say that no matching todo was found", done => {
		request(app)
			.delete(`/todos/${new ObjectId()}`)
			.expect(200)
			.expect(res => {
				Todo.find().then(todos => expect(todos.length).toBe(2));
				expect(res.body.errorMessage).toBe("No todo with corresponding ID found");
			})
			.end(done);
	});

	it("should return a 404", done => {
		request(app)
			.delete("/todos/1")
			.expect(404)
			.expect(res => expect(res.body.errorMessage).toBe("Invalid object ID"))
			.end(done);
	});

	it("should delete all todos", done => {
		request(app)
			.delete("/todos")
			.expect(200)
			.end((err, res) => {
				if(err) {
					return done(err);
				}
				Todo.find().then(todos => expect(todos.length).toBe(0));
				done();
			});
	});
});

describe("PATCH /todos/:id", () => {
	it("should update the todo", done => {
		request(app)
		.patch(`/todos/${seedTodos[0]._id}`)
		.send({"text": "updated text", "completed": true})
		.expect(200)
		.end( (err, res) => {
			if(err) {
				return done(err);
			}
			Todo.find().then(todos => {
				expect(todos.length).toBe(2);
				expect(todos[0].text).toBe("updated text");
				expect(todos[0].completed).toBe(true);
				expect(todos[0].completedAt).not.toBeNull()
				done();
			});
		});
	});

	it("should clear the completedAt property", done => {
		request(app)
		.patch(`/todos/${seedTodos[1]._id}`)
		.send({"completed": false})
		.expect(200)
		.end( (err, res) => {
			if(err) {
				return done(err);
			}
			Todo.find().then(todos => {
				expect(todos.length).toBe(2);
				expect(todos[1].text).toBe("second test todo");
				expect(todos[1].completed).toBe(false);
				expect(todos[1].completedAt).toBeNull()
				done();
			});
		});
	});

	it("should not find the todo", done => {
		request(app)
		.patch(`/todos/${seedTodos[0]._id +1}`)
		.send({"text": "updated text", "completed": true})
		.expect(404)
		.end( (err, res) => {
			if(err) {
				return done(err);
			}
			Todo.find().then(todos => {
				expect(todos.length).toBe(2);
				expect(todos[0].text).not.toBe("updated text");
				expect(todos[0].completed).toBe(false);
				expect(todos[0].completedAt).toBeNull()
				done();
			});
		});
	});

	it("should send a 404", done => {
		request(app)
		.patch(`/todos/${seedTodos[0]._id}1`)
		.send({"text": "updated text", "completed": true})
		.expect(404)
		.end( (err, res) => {
			if(err) {
				return done(err);
			}
			Todo.find().then(todos => {
				expect(todos.length).toBe(2);
				expect(todos[0].text).not.toBe("updated text");
				expect(todos[0].completed).toBe(false);
				expect(todos[0].completedAt).toBeNull()
				done();
			});
		});
	});
});

describe("GET /users/me", () => {
	it("should return user if authenticated", done => {
		request(app)
			.get("/users/me")
			.set("x-auth", seedUsers[0].tokens[0].token)
			.expect(200)
			.expect( res => {
				expect(res.body._id).toBe(seedUsers[0]._id.toHexString());
				expect(res.body.email).toBe(seedUsers[0].email);
			}).end(done);
	});

	it("should return a 401 if not authenticated", done => {
		request(app)
			.get("/users/me")
			.expect(401)
			.expect( res => expect(res.body).toEqual({}))
			.end(done);
	});
})

describe("POST /user", () => {
	it("should create a users", done => {
		var email = "azerty@gmail.com";
		var password = "pass1234";
		request(app)
			.post("/users")
			.send({email, password})
			.expect(200)
			.expect( res => {
				expect(res.header["x-auth"]).toBeDefined();
				expect(res.body._id).toBeDefined();
				expect(res.body.email).toBe(email);
			})
			.end( err => {
				if(err) {
					return done(err);
				}
				User.findOne({email}).then( user => {
					expect(user).toBeDefined();
					expect(user.email).toEqual(email);
					expect(user.password).not.toEqual(password);
					done();
				})
			})
	});

	it("should return validation errors if request invalid", done => {
		request(app)
			.post("/users")
			.send({email:"caca", password:"caca"})
			.expect(400)
			.end( (err,res) => {
				if(err) {
					return done(err);
				}
				User.find()
					.then( users => {
						expect(users.length).toEqual(2)
						return done();
					});
			});
	});

	it("should not create user if email in use", done => {
		var password = "pass1234";
		request(app)
			.post("/users")
			.send({email: seedUsers[0].email, password})
			.expect(400)
			.end( (err,res) => {
				if(err) {
					return done(err);
				}
				User.find()
					.then( users => {
						expect(users.length).toEqual(2)
						return done();
					});
			});
	});
})