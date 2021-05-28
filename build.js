const fs = require('fs-extra');
const assert = require('assert');
const sitemap = require('./src/sitemap.json');

const { dirs, copy, html } = sitemap;

fs.emptyDirSync('./dist');

dirs.forEach((item) => {
  const dir = `./dist/${item.replace('*', '')}`;
  fs.emptyDirSync(dir);
});

copy.forEach((item) => {
  if (item.endsWith('*')) {
    const fromDir = `./src/${item.replace('*', '')}`;
    const toDir = `./dist/${item.replace('*', '')}`;
    fs.copySync(fromDir, toDir);
  }
});

html.forEach((item) => {
  assert(item.template, 'Template missing');
  assert(item.template, 'Out missing');
  let contents = fs.readFileSync(`./src/${item.template}`).toString();
  const regexpSubs = /{{(.*)}}/ig;
  contents.match(regexpSubs).forEach((subExpr) => {
    const subProp = subExpr.replace(/[{} ]/g, '');
    const substitution = item.substitutions[subProp];
    const subContent = substitution.startsWith('./')
      ? fs.readFileSync(`./src/${substitution.replace('./', '')}`)
      : substitution;
    contents = contents.replace(subExpr, subContent);
  });
  fs.writeFileSync(`./dist/${item.out}`, contents);
});
