const fs = require('fs');
const chokidar = require('chokidar');
const http = require('http');
const builder = require('./builder');

http.createServer(function (req, res) {
  const url = req.url.endsWith('/') ? `${req.url}index.html` : req.url;
  const file = `${__dirname}/dist${url}`.split('?')[0];
  console.log('GET', req.url, file);
  fs.readFile(file, function (err,data) {
    if (err) {
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }
    res.writeHead(200);
    res.end(data);
  });
}).listen(8000, () => console.log('Server listening at http://localhost:8000'));

const logAndRebuild = (msg) => {
  console.log(msg);
  builder.build();
};

chokidar
  .watch('./src', {
    ignoreInitial: true,
  })
  .on('ready', () => logAndRebuild('Ready'))
  .on('add', path => logAndRebuild(`File ${path} has been added`))
  .on('change', path => logAndRebuild(`File ${path} has been changed`))
  .on('unlink', path => logAndRebuild(`File ${path} has been removed`));;
