const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const defaultDir = 'C:/Program Files/Microsoft VS Code'

const exists = dir => new Promise(resolve => {
  dir = path.resolve(dir)
  fs.stat(dir, (err, stats) => {
    if (err) {
      throw new Error(`'${dir}' is not exists.`)
    }
    if (!stats.isDirectory()) {
      throw new Error(`'${dir}' is not directory.`)
    }
    resolve(dir)
  })
})

const patch = dir => new Promise(resolve => {
  const target = path.join(dir, 'out/vs/workbench/workbench.desktop.main.css')
  fs.readFile(target, 'utf8', (err, contents) => {
    if (err) {
      throw new Error(`'${target}' is not exists.`)
    }

    contents += '.explorer-viewlet .explorer-item{pointer-events:none}'

    fs.writeFile(target, contents, err => {
      if (err) {
        throw new Error('Make sure you have write access rights to the VSCode files.')
      }
      resolve(dir)
    })
  })
})

const checksum = dir => new Promise(resolve => {
  const prodFilename = path.join(dir, 'product.json')
  const product = require(prodFilename)

  let changed = false
  for (const file in product.checksums) {
    const contents = fs.readFileSync(path.join(dir, 'out', file))
    const checksum = crypto.createHash('md5').update(contents).digest('base64').replace(/=+$/, '')
    if (product.checksums[file] !== checksum) {
      product.checksums[file] = checksum
      changed = true
    }
  }

  if (!changed) return resolve(changed)

  const json = JSON.stringify(product, null, '\t')
  fs.rename(prodFilename, `${prodFilename}.bak`, err => {
    if (err) throw err
    fs.writeFile(prodFilename, json, err => {
      if (err) throw err
      resolve(changed)
    })
  })
})

module.exports = ({ dir = defaultDir }) => {
  exists(dir)
    .then(dir => exists(path.join(dir, 'resources/app')))
    .then(dir => patch(dir))
    .then(dir => checksum(dir))
    .then(res => {
      if (res) {
        console.log('Please restart VSCode to see effect.')
      } else {
        console.log('No changed.')
      }
    })
    .catch(e => console.error(e.message))
}
