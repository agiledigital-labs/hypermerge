
import fs from "fs"
import { Repo } from "../src"
const raf: Function = require("random-access-file")
const ram: Function = require("random-access-memory")
const DiscoverySwarm = require("discovery-swarm");
const defaults = require('dat-swarm-defaults')
const id = process.argv[2]
const _path = process.argv[3]
const path = _path || ".data"

if (id === undefined) {
  console.log("Usage: watch DOC_ID [REPO]")
  process.exit()
}

/*
if (_path && !fs.existsSync(_path + "/ledger")) {
  console.log("No repo found: " + _path)
  process.exit()
}
*/

const storage = _path ? raf : ram
const repo = new Repo({ path, storage })

const hyperswarmwrapper = new DiscoverySwarm(defaults({stream: repo.stream, id: repo.id }));

repo.replicate(hyperswarmwrapper);

repo.meta(id,(meta) => {
  console.log(meta)
  if (meta && meta.type === "File") {
    repo.readFile(id, (file,mimeType) => {
      console.log("FILE",file.length,mimeType)
    })
  } else {
    repo.watch(id, (val,c) => {
      console.log("CLOCK",c)
      console.log(val)
    })
  }
})

