import { toByteArray } from 'base64-js'
import Epub from 'epubjs'
import md5 from 'md5'
import store from '../store'
import vuetify from '../plugins/vuetify'
import bg_paper_dark from '../assets/img/bg-paper-dark.jpg'
import bg_paper from '../assets/img/bg-paper.jpg'

export function throttle(fn, ms = 160) {
  // let timeout
  let start = new Date()
  return function () {
    let context = this
    let args = arguments
    let curr = new Date() - 0
    // clearTimeout(timeout)
    if (curr - start >= ms) {
      fn.apply(context, args)
      start = curr
    } else {
      // timeout = setTimeout(() => fn.apply(context, args), ms)
    }
  }
}

export function throttle2(fn, ms = 160) {
  let timeout
  let start = new Date()
  return function () {
    let context = this
    let args = arguments
    let curr = new Date() - 0
    clearTimeout(timeout)
    if (curr - start >= ms) {
      fn.apply(context, args)
      start = curr
    } else {
      timeout = setTimeout(() => fn.apply(context, args), ms)
    }
  }
}

export function flatten(array) {
  return [].concat(...array.map((item) => [].concat(item, ...flatten(item.subitems))))
}

export function saveReadProgress(fileName, cfi) {
  let record = JSON.parse(localStorage.getItem(`Reading_Record`) || '{}')
  if (!record[fileName]) record[fileName] = {}
  record[fileName].cfi = cfi
  localStorage.setItem(`Reading_Record`, JSON.stringify(record))
}

export function GetReadProgress(fileName) {
  let record = JSON.parse(localStorage.getItem(`Reading_Record`) || '{}')
  return record[fileName]?.cfi
}

export const ImagePath = window.device?.getExternalFilesDir('Pictures')
export const StatusBarHeight = (window.device?.getStatusBarHeight() || 0) / window.devicePixelRatio
document.documentElement.style.setProperty('--status-bar-height', StatusBarHeight + 'px')

const readFilePromise = {}

export function getImagePath(name, uri) {
  if (readFilePromise[uri]) return readFilePromise[uri]
  return new Promise(function (resolve, reject) {
    if (store.getters.coverCache[name]) resolve(store.getters.coverCache[name])
    if (name.startsWith('http')) resolve(name)
    let path = ImagePath + '/' + name
    if (window.device) {
      if (!device.fileExits(path)) {
        readFilePromise[uri] = this
        let data = toByteArray(device.readFile(uri))
        let book = new Epub()
        book.open(data.buffer).then(async () => {
          let cover = await book.loaded.cover
          let coverData = await book.archive.getBase64(cover || '/OEBPS/Images/cover.jpg')
          // let coverData = await book.archive.getBase64(cover)
          new Promise(function () {
            device.saveFile(name, 'Pictures', coverData)
          })
          store.commit('updateCoverCache', { name: name, data: coverData })
          resolve(coverData)
        })
      } else {
        if (window.location.origin !== 'file://') {
          const result = 'data:image/jpeg;base64,' + device.readFile(path)
          store.commit('updateCoverCache', { name: name, data: result })
          resolve(result)
        }else {
          const result = 'file://' + path
          store.commit('updateCoverCache', { name: name, data: result })
          resolve(result)
        }
      }
    } else {
      const result = 'file://' + path
      store.commit('updateCoverCache', { name: name, data: result })
      resolve(result)
    }
  })
}

export function getImagePath2(name, uri) {
  if (readFilePromise[uri]) return readFilePromise[uri]
  return new Promise(function (resolve, reject) {
    if (store.getters.coverCache[name]) resolve()
    if (name.startsWith('http')) {
      store.commit('updateCoverCache', { name: name, data: name })
      resolve()
    }
    let path = ImagePath + '/' + name
    if (window.device) {
      if (!device.fileExits(path)) {
        readFilePromise[uri] = this
        device.readFileAsync(0, name, uri)
        resolve()
      } else {
        if (window.location.origin !== 'file://') {
          device.readFileAsync(1, name, path)
          resolve()
        }else {
          const result = 'file://' + path
          store.commit('updateCoverCache', { name: name, data: result })
          resolve(result)
        }
      }
    }else {
      const result = 'file://' + path
      store.commit('updateCoverCache', { name: name, data: result })
      resolve()
    }
  })
}

export function loadBg(themes){
  switch (store.state.read.readingBgSetting) {
    case 'custom': {
      break
    }
    case 'paper': {
      themes.override(
        'background',
        `url(${vuetify.theme?.dark ? bg_paper_dark : bg_paper}) repeat`
      )
      break
    }
    default:
      themes.override('--color', '')
  }
}