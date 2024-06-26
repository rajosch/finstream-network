const app = require('./app');
const port = 3000;

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
