const express = require("express");

const app = express();

app.use((req, res) => {
  res.send("The testing tour routes is here");
});

const port = 3000;

const server = app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});
