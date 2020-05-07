const NodeMediaServer = require('node-media-server')
const fs = require('fs')
const IPFS = require('ipfs')
const FormData = require('form-data')
const concat = require('concat-stream')
const rp = require('request-promise')

const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: 8000,
    mediaroot: './media',
    allow_origin: '*'
  },
  trans: {
    ffmpeg: '/usr/local/bin/ffmpeg',
    tasks: [
      {
        app: 'live',
        vc: "copy",
        vcParam: [],
        ac: "aac",
        acParam: ['-ab', '64k', '-ac', '1', '-ar', '44100'],
        rtmp:true,
        rtmpApp:'live2',
        hls: true,
        hlsFlags: '[hls_time=10:hls_list_size=0:hls_flags=delete_segments]',
        // dash: true,
        // dashFlags: '[f=dash:window_size=3:extra_window_size=5]'
      }
    ]
  }
}

var nms = new NodeMediaServer(config)
nms.run()

fs.watch('./media/live/', {}, async (eventType, filename) => {
  // console.log('eventType: ', eventType, ' filename: ', filename)
  if (!filename.includes('.tmp')
      && !filename.includes('.m4s')
      ) {
        try {
          console.log('trying filename: ', filename)
          const url = `http://localhost:3873/upload`
          const fileData = fs.createReadStream(`media/live/${filename}`)
          // console.log('fileData: ', fileData)
          var formData = new FormData()
          formData.append('file', fileData, filename)
          formData.append('filename', filename)
          formData.append('kylan', 'test')
          formData.maxDataSize = Infinity
          const response = await rp({
            method: 'POST',
            url: 'http://localhost:3873/upload',
            formData: {
              // Like <input type="text" name="name">
              name: 'upload',
              // Like <input type="file" name="file">
              file: {
                  value: fileData,
                  options: {
                      filename
                  }
              }
            },
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            json: true
          })
          console.log('response: ', response.result)
        } catch (error) {
          console.log('error: ', error)
        }

    // need to remove to separate function that can be called
    // periodically on previously-failed uploads
    // will have to keep data in database
    // exec(`ipfs add ./media/live/${filename}`, (err, stdout, stderr) => {
    //   if (err) {
    //     //some err occurred
    //     console.error(err)
    //   } else {
    //    // the *entire* stdout and stderr (buffered)
    //    console.log(`stdout: ${stdout}`)
    //    console.log(`stderr: ${stderr}`)
    //   }
    // })
  }
})