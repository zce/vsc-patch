const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const defaultDir = 'C:/Program Files/Microsoft VS Code'

const exists = dir => new Promise((resolve, reject) => {
  dir = path.resolve(dir)
  fs.stat(dir, (err, stats) => {
    if (err) {
      return reject(new Error(`'${dir}' is not exists.`))
    }
    if (!stats.isDirectory()) {
      return reject(new Error(`'${dir}' is not directory.`))
    }
    resolve(dir)
  })
})

const patch = dir => new Promise((resolve, reject) => {
  const target = path.join(dir, 'out/vs/workbench/workbench.desktop.main.css')
  fs.readFile(target, 'utf8', (err, contents) => {
    if (err) {
      return reject(new Error(`'${target}' is not exists.`))
    }
    contents = contents.replace(
      '.monaco-icon-label{display:flex;overflow:hidden;text-overflow:ellipsis}',
      '.monaco-icon-label{display:flex;overflow:hidden;text-overflow:ellipsis;pointer-events:none}'
    )
    fs.writeFile(target, contents, err => {
      if (err) {
        return reject(new Error('Make sure you have write access rights to the VSCode files.'))
      }
      resolve(dir)
    })
  })
})

const checksum = dir => new Promise((resolve, reject) => {
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
    if (err) return reject(err)
    fs.writeFile(prodFilename, json, err => {
      if (err) return reject(err)
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
