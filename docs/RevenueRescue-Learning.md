## Day 1 — Foundation

### Step 1 — Node.js + Express

#### What I learned

Node.js allows JavaScript to run outside the browser.

npm is the package manager for Node.js projects.

Express is a framework/library that helps us create HTTP servers and APIs using Node.js.

`express()` creates an Express application.

`app` is the Express application that we configure with routes.

`app.get()` creates a route that responds to HTTP GET requests.

`/health` is the URL path of our health-check endpoint.

`req` represents the incoming HTTP request.

`res` represents the response we send back to the client.

`res.send()` sends data back to the client.

`app.listen()` starts the server and makes it listen for requests on a specific port.

### console.log vs res.send

`console.log()`:
Used to print information in the server/terminal for the developer.

`res.send()`:
Used to send a response from the server back to the client.

Example:

app.get("/health", (req, res) => {
    res.send({
        status: "OK"
    });
});

#### What I had to remember/look up

I didn't remember the exact Express route syntax initially.

I needed to understand:
- `req`
- `res`
- `res.send()`


## Step 2 — MongoDB + Mongoose

### MongoDB
MongoDB is the database where our application will persist data.

### Mongoose
Mongoose is the Node.js library we use to communicate with MongoDB and define schemas/models.

### Why do we need a database?
RevenueRescue needs to persist payment events and customer history rather than losing everything when the server restarts.

### Architecture

Node.js + Express
        ↓
     Mongoose
        ↓
     MongoDB

### Environment variable

MONGODB_URI will store the database connection string.

We should not hard-code credentials or connection strings in source code.

### What Antigravity generated
[Fill this after reviewing it]

### What I understand
[Fill this]

### What I don't understand
[Fill this]