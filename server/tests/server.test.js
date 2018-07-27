const expect = require("expect");
const request = require("supertest");
const {ObjectId} = require("mongodb");

const {app} = require("./../server");
const {Todo} = require("./../models/todo");

const id = "5b598f0849ffcf1acc0b6326";
const seedTodos = [{
	_id : id,
	text: "first test todo"
}, {
	text: "second test todo"
}]

beforeEach( done => {
	Todo.remove({})
		.then( () => Todo.insertMany(seedTodos))
		.then( () => done());
});

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
				.get(`/todos/${id}`)
				.expect(200)
				.expect(res => expect(res.body.todo).toBeTruthy())
				.end(done);
		});

		it("should return a 404", done => {
			request(app)
				.get(`/todos/${id}111`)
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