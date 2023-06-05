const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// API 1 (GET)
app.get("/todos/", async (request, response) => {
  const { status, priority, search_q = "" } = request.query;

  let getAllTodosQuery = `SELECT * FROM todo`;

  if (status || priority || search_q) {
    getAllTodosQuery += ` WHERE`;

    if (status) {
      getAllTodosQuery += ` status = '${status}'`;
    }
    if (priority) {
      if (status) getAllTodosQuery += ` AND`;
      getAllTodosQuery += ` priority = '${priority}'`;
    }
    if (search_q) {
      if (status || priority) getAllTodosQuery += ` AND`;
      getAllTodosQuery += ` todo LIKE '%${search_q}%'`;
    }
  }

  const todoList = await db.all(getAllTodosQuery);
  response.send(todoList);
});

// API 2 (GET by id)

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT 
    *
    FROM
     todo
    WHERE
      id = ${todoId};

    `;

  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

// API 3  (POSt)
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postTodoQuery = `
  insert into todo(id,todo,priority,status)
  values(
    ${id},'${todo}','${priority}','${status}'
  )
  `;

  const todolist = await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

// API 4 (PUT)
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const reqBody = request.body;
  const previousTodoQuery = `

    select 
     * 
    from todo
    where
    id =  ${todoId}
`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    id = previousTodoQuery.id,
    todo = previousTodoQuery.todo,
    priority = previousTodoQuery.priority,
    status = previousTodoQuery.status,
  } = reqBody;

  const updateTodoQuery = `
  UPDATE todo
    SET 
      todo = '${todo}',
      priority = '${priority}',
      status = '${status}'
    WHERE 
      id = ${todoId};`;

  const todolist = await db.run(updateTodoQuery);
  //   response.send(`${reqBody} Updated`);
  response.send(
    `${status ? "Status" : ""}${priority ? "Priority" : ""}${
      todo ? "Todo" : ""
    } Updated`
  );
  //   response.send(previousTodo);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const deleteTodoQuery = `DELETE FROM todo WHERE id = ${todoId};`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

// ---------
module.exports = app;
// app.listen(3000, () => {
//   console.log(`Server is running at http://localhost:3000`);
// });
