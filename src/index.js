const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];



// Checks if the users already exists, if don't then send an error.
function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find((user) => user.username === username);

  if(!user){
    return response.status(404).json({ error: "User not Found!" });
  }

  request.user = user;

  next();
}


// Checks if the username is already in use, if it is then send an error.
function checkUsernameInUse(request, response, next){
  const { username } = request.body;

  const contains = users.some((user) => user.username === username);

  if(contains){
    return response.status(400).json({ error: 'Username already in use!' });
  }

  next();
}


// Checks if a todo exists, if it exists then allow to access its value on request.
function checksExistsTodo(request, response, next){
  const { id } = request.params;
  const { user } = request;

  const index = user.todos.findIndex((todo) => todo.id === id);

  if(index === -1){
    response.status(404).json({ error: 'Todo not Found!' })
  }

  request.todoIndex = index;

  next();
}


// Creates a new User
app.post('/users', checkUsernameInUse, (request, response) => {
  const { name, username } = request.body;

  const user = {
    id: uuidv4(),
    name,
    username,
    todos: []
  }

  users.push(user)
  
  return response.status(201).json(user);
});


// Lists all users
app.get('/users', (request, response) => {
  response.json(users);
})


// Lists all TODOs for a specific user.
app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request

  return response.status(201).json(user.todos)
});


// Create a new TODO
app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  
  const { user } = request

  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  }

  user.todos.push(todo)

  return response.status(201).json(todo);
});


// Update a TODO
app.put('/todos/:id', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const { title, deadline } = request.body;
  const { user, todoIndex } = request;

  const todo = user.todos[todoIndex];

  todo.title = title;
  todo.deadline = deadline;

  return response.status(201).json(todo);
});


// Mark a TODO as done
app.patch('/todos/:id/done', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const { user, todoIndex } = request;

  const todo = user.todos[todoIndex];
  todo.done = true;

  return response.status(201).json(todo);
});


// Delete a TODO
app.delete('/todos/:id', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const { user, todoIndex } = request;

  const todos = user.todos.splice(todoIndex, 1);

  return response.status(204).send();
});


module.exports = app;